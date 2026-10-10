import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeBooking } from "@/lib/serializers";
import { notifyUser } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

// PATCH /api/bookings/:id  { status: "CONFIRMED" | "DECLINED" | "CANCELLED" }
// CONFIRMED/DECLINED: venue owner (or admin) only.
// CANCELLED (Task 28, Phase 6): the booking's own user can also cancel
// their own pending/confirmed booking, not just the venue owner.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const booking = await prisma.booking.findUnique({ where: { id: params.id }, include: { venue: true } });
  if (!booking) return jsonError("Booking not found", 404);

  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (!["CONFIRMED", "DECLINED", "CANCELLED"].includes(status)) return jsonError("Invalid status");

  const isOwner = booking.venue.ownerId === user.id;
  const isBooker = booking.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (status === "CANCELLED") {
    if (!isOwner && !isBooker && !isAdmin) return jsonError("Forbidden", 403);
    if (booking.status === "CANCELLED" || booking.status === "DECLINED") {
      return jsonError("This booking is already cancelled.", 409);
    }
  } else if (!isOwner && !isAdmin) {
    return jsonError("Forbidden", 403);
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data:
      status === "CANCELLED"
        ? { status, cancelledAt: new Date(), cancelledByUserId: user.id }
        : { status },
    include: { venue: true, user: true },
  });

  if (status === "CONFIRMED") {
    await prisma.venue.update({
      where: { id: booking.venueId },
      data: {
        bookingsToday: { increment: 1 },
        revenueThisMonth: { increment: booking.amount },
        slotsLeftToday: { decrement: 1 },
      },
    });
  }

  const titles: Record<string, string> = {
    CONFIRMED: "Booking confirmed",
    DECLINED: "Booking declined",
    CANCELLED: isBooker ? "A player cancelled their booking" : "Your booking was cancelled",
  };
  // Notify whichever side didn't just take the action.
  const notifyRecipient = status === "CANCELLED" && isOwner ? booking.userId : status === "CANCELLED" && isBooker ? booking.venue.ownerId : booking.userId;

  await notifyUser({
    userId: notifyRecipient,
    title: titles[status],
    detail: `${booking.venue.name} · ${booking.slot}`,
    type: "BOOKING",
  });

  logAudit(user.id, "BOOKING", `BOOKING_STATUS_${status}`, "Booking", updated.id, updated.slot, user.role);

  return NextResponse.json({ booking: serializeBooking(updated) });
});
