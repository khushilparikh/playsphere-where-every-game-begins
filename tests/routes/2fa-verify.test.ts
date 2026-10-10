import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/twofa", () => ({ verifyTotpCode: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { verifyTotpCode } from "@/lib/twofa";
import { POST } from "@/app/api/auth/2fa/verify/route";

const mockUserWithSecret = {
  id: "user1",
  name: "Player 1",
  totpSecret: "JBSWY3DPEHPK3PXP",
  totpEnabled: false,
};

function makeVerifyRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/2fa/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unauthenticated request with 401", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null as any);
    const res = await POST(makeVerifyRequest({ code: "123456" }));
    expect(res.status).toBe(401);
  });

  it("rejects request if user has not initiated 2FA setup (missing totpSecret)", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "user1", totpSecret: null } as any);
    const res = await POST(makeVerifyRequest({ code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid code with 400", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockUserWithSecret as any);
    vi.mocked(verifyTotpCode).mockReturnValue(false);

    const res = await POST(makeVerifyRequest({ code: "000000" }));
    expect(res.status).toBe(400);
  });

  it("enables 2FA and returns 200 OK on valid code", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockUserWithSecret as any);
    vi.mocked(verifyTotpCode).mockReturnValue(true);

    const res = await POST(makeVerifyRequest({ code: "123456" }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { totpEnabled: true },
    });
  });
});
