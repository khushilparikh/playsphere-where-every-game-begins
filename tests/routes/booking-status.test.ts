import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: vi.fn().mockResolvedValue(1),
    booking: { findUnique: vi.fn(), update: vi.fn() },
    venue: { update: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/notify", () => ({ notifyUser: vi.fn().mockResolvedValue(null) }));

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { PATCH } from "@/app/api/bookings/[id]/route";

const mockPlayer = { id: "user1", name: "Player One", role: "PLAYER" };
const mockOwner = { id: "owner1", name: "Venue Owner", role: "VENUE_OWNER" };
const mockOtherUser = { id: "user2", name: "Rival Player", role: "PLAYER" };

const mockBooking = {
  id: "b123",
  venueId: "v1",
  userId: "user1",
  sport: "FOOTBALL",
  slot: "Sun, 10 Jan, 10:00",
  amount: 600,
  status: "PENDING",
  venue: { id: "v1", ownerId: "owner1", name: "Super Turf" },
};

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bookings/b123", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PATCH /api/bookings/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unauthenticated request with 401", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null as any);
    const res = await PATCH(makePatchRequest({ status: "CANCELLED" }), { params: { id: "b123" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the booking does not exist", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockPlayer as any);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null as any);

    const res = await PATCH(makePatchRequest({ status: "CANCELLED" }), { params: { id: "missing" } });
    expect(res.status).toBe(404);
  });

  it("rejects an invalid status string with 400", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockPlayer as any);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);

    const res = await PATCH(makePatchRequest({ status: "INVALID_STATUS" }), { params: { id: "b123" } });
    expect(res.status).toBe(400);
  });

  it("prevents an unauthorized user from cancelling someone else's booking", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockOtherUser as any);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);

    const res = await PATCH(makePatchRequest({ status: "CANCELLED" }), { params: { id: "b123" } });
    expect(res.status).toBe(403);
  });

  it("allows the booking owner (booker) to cancel their booking", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockPlayer as any);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);
    vi.mocked(prisma.booking.update).mockResolvedValue({
      ...mockBooking,
      status: "CANCELLED",
      user: mockPlayer,
    } as any);

    const res = await PATCH(makePatchRequest({ status: "CANCELLED" }), { params: { id: "b123" } });
    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "b123" },
        data: expect.objectContaining({ status: "CANCELLED", cancelledByUserId: "user1" }),
      })
    );
  });

  it("allows the venue owner to confirm a booking and increments venue stats", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockOwner as any);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);
    vi.mocked(prisma.booking.update).mockResolvedValue({
      ...mockBooking,
      status: "CONFIRMED",
      user: mockPlayer,
    } as any);

    const res = await PATCH(makePatchRequest({ status: "CONFIRMED" }), { params: { id: "b123" } });
    expect(res.status).toBe(200);
    expect(prisma.venue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: expect.objectContaining({
          bookingsToday: { increment: 1 },
          revenueThisMonth: { increment: 600 },
          slotsLeftToday: { decrement: 1 },
        }),
      })
    );
  });

  it("rejects cancelling a booking that is already cancelled", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(mockPlayer as any);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...mockBooking,
      status: "CANCELLED",
    } as any);

    const res = await PATCH(makePatchRequest({ status: "CANCELLED" }), { params: { id: "b123" } });
    expect(res.status).toBe(409);
  });
});
