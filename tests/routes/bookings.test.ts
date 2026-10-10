import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// High-risk route: handles the slot-conflict check (Task 4, Phase 2) and
// recurring-booking generation (Task 25, Phase 6). Everything it talks to
// (Prisma, auth, notifications, gamification) is mocked so this test
// exercises the route's own logic/branching in isolation, without needing
// a live database.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: vi.fn().mockResolvedValue(1),
    venue: { findUnique: vi.fn() },
    booking: { findMany: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/notify", () => ({ notifyUser: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/gamification", () => ({
  awardXp: vi.fn().mockResolvedValue(undefined),
  awardBadge: vi.fn().mockResolvedValue(undefined),
  XP_REWARDS: { VENUE_BOOKED: 10 },
}));

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { POST } from "@/app/api/bookings/route";

const mockUser = { id: "user1", name: "Test Player" };
const mockVenue = { id: "venue1", ownerId: "owner1", name: "Test Arena", pricePerHour: 500 };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bookings", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unauthenticated request with 401", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null as any);
    const res = await POST(makeRequest({ venueId: "venue1", slot: "Sun, 4 Jan, 09:00", sport: "Football" }));
    expect(res.status).toBe(401);
  });

  it("rejects a body that fails schema validation", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockUser as any);
    const res = await POST(makeRequest({ venueId: "venue1" })); // missing slot/sport
    expect(res.status).toBe(400);
  });

  it("returns 404 when the venue doesn't exist", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.venue.findUnique).mockResolvedValue(null as any);
    const res = await POST(makeRequest({ venueId: "missing", slot: "Sun, 4 Jan, 09:00", sport: "Football" }));
    expect(res.status).toBe(404);
  });

  it("returns 409 when the slot is already booked (Task 4 slot-conflict check)", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.venue.findUnique).mockResolvedValue(mockVenue as any);
    vi.mocked(prisma.booking.findMany).mockResolvedValue([{ id: "existing-booking", slot: "Sun, 4 Jan, 09:00", status: "CONFIRMED" }] as any);

    const res = await POST(makeRequest({ venueId: "venue1", slot: "Sun, 4 Jan, 09:00", sport: "Football" }));
    expect(res.status).toBe(409);
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it("creates a booking and returns 201 on a clean, available slot", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.venue.findUnique).mockResolvedValue(mockVenue as any);
    vi.mocked(prisma.booking.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.booking.create).mockResolvedValue({
      id: "b1",
      venueId: "venue1",
      userId: "user1",
      slot: "Sun, 4 Jan, 09:00",
      amount: 500,
      status: "PENDING",
      venue: mockVenue,
      user: mockUser,
    } as any);

    const res = await POST(makeRequest({ venueId: "venue1", slot: "Sun, 4 Jan, 09:00", sport: "Football" }));
    expect(res.status).toBe(201);
    expect(prisma.booking.create).toHaveBeenCalledTimes(1);
  });
});
