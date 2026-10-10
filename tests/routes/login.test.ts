import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Highest-risk route in the app: password verification, rate limiting,
// account suspension/deletion checks, and 2FA (Task 47, Phase 6) all
// gate here before a session cookie is ever issued.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: vi.fn().mockResolvedValue(1),
    user: { findUnique: vi.fn() },
    loginEvent: { create: vi.fn().mockResolvedValue({}), findFirst: vi.fn().mockResolvedValue({ id: "seen" }) },
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue(true),
  clientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));
vi.mock("@/lib/notify", () => ({ notifyUser: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/twofa", () => ({ verifyTotpCode: vi.fn() }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    verifyPassword: vi.fn(),
    signToken: vi.fn().mockReturnValue("fake.jwt.token"),
  };
});

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/auth";
import { verifyTotpCode } from "@/lib/twofa";
import { POST } from "@/app/api/auth/login/route";

const baseUser = {
  id: "u1",
  email: "player@example.com",
  passwordHash: "hashed",
  role: "PLAYER",
  status: "ACTIVE",
  deletedAt: null,
  totpEnabled: false,
  totpSecret: null,
  notifyEmail: true,
  tokenVersion: 0,
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks resets call history but not implementations set via
    // mockReturnValue, so the "not rate-limited" default has to be
    // re-established each test — otherwise a later test that sets
    // checkRateLimit to false would leak into every test after it.
    vi.mocked(checkRateLimit).mockReturnValue(true);
    vi.mocked(prisma.loginEvent.create).mockResolvedValue({} as any);
    vi.mocked(prisma.loginEvent.findFirst).mockResolvedValue({ id: "seen" } as any);
  });

  it("rejects a request missing email or password", async () => {
    const res = await POST(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate-limited, before even checking credentials", async () => {
    vi.mocked(checkRateLimit).mockReturnValue(false);
    const res = await POST(makeRequest({ email: "player@example.com", password: "whatever" }));
    expect(res.status).toBe(429);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 401 for a non-existent email without revealing that specifically", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);
    const res = await POST(makeRequest({ email: "nobody@example.com", password: "x" }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 401 for a wrong password and logs the failed attempt", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(baseUser as any);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const res = await POST(makeRequest({ email: baseUser.email, password: "wrong" }));
    expect(res.status).toBe(401);
    expect(prisma.loginEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ success: false }) }));
  });

  it("blocks a suspended account even with the correct password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...baseUser, status: "SUSPENDED" } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await POST(makeRequest({ email: baseUser.email, password: "correct" }));
    expect(res.status).toBe(403);
  });

  it("blocks a deleted account", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...baseUser, deletedAt: new Date() } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await POST(makeRequest({ email: baseUser.email, password: "correct" }));
    expect(res.status).toBe(403);
  });

  it("requires a 2FA code for an account with totpEnabled, without issuing a session", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...baseUser, totpEnabled: true, totpSecret: "SECRET" } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await POST(makeRequest({ email: baseUser.email, password: "correct" })); // no code
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.requires2FA).toBe(true);
    expect((res as NextResponse).cookies.get("playsphere_token")).toBeUndefined();
  });

  it("rejects an incorrect 2FA code", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...baseUser, totpEnabled: true, totpSecret: "SECRET" } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(verifyTotpCode).mockReturnValue(false);

    const res = await POST(makeRequest({ email: baseUser.email, password: "correct", code: "000000" }));
    expect(res.status).toBe(401);
  });

  it("logs in successfully with correct password and no 2FA required", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(baseUser as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await POST(makeRequest({ email: baseUser.email, password: "correct" }));
    expect(res.status).toBe(200);
    expect(prisma.loginEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ success: true }) }));
  });

  it("logs in successfully with a correct 2FA code", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...baseUser, totpEnabled: true, totpSecret: "SECRET" } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(verifyTotpCode).mockReturnValue(true);

    const res = await POST(makeRequest({ email: baseUser.email, password: "correct", code: "123456" }));
    expect(res.status).toBe(200);
  });
});
