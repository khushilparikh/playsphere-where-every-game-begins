import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/venues/:id/availability?datePrefix=<string>
//
// Task 19, Phase 5 — a first pass at venue availability, working within
// the existing schema rather than requiring a bigger migration first.
// `Booking.slot` is a free-text display string (e.g. "Sun, 7 Jan, 14:00"
// — see the exact format built in BookVenueModal on the venues page), not
// a structured date/time column, so this can't do a true calendar-style
// query. Instead, the frontend computes the same date-prefix string it
// would use for the booking it's about to create ("Sun, 7 Jan, ") and
// this route returns which time slots already have a PENDING/CONFIRMED
// booking under that prefix — enough to show "14:00 and 18:00 are
// already booked for this date" before submitting, and pairs with the
// slot-conflict check already enforced server-side in POST /api/bookings
// (Task 4, Phase 2).
//
// A future migration splitting `slot` into structured start/end DateTime
// columns would allow a real drag-and-drop weekly calendar instead of
// this prefix-matched list.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { searchParams } = new URL(req.url);
  const datePrefix = searchParams.get("datePrefix")?.trim();
  if (!datePrefix) return jsonError("datePrefix query param is required");

  const bookings = await prisma.booking.findMany({
    where: {
      venueId: params.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      slot: { startsWith: datePrefix, mode: "insensitive" },
    },
    include: { payment: true }
  });

  const slotStates = bookings.map((b: any) => {
    const time = b.slot.slice(datePrefix.length).trim();
    let status = "BOOKED";
    if (b.status === "PENDING") {
      if (b.paymentStatus === "SUCCESS") {
        status = "BOOKED";
      } else if (b.payment && new Date(b.payment.expiresAt).getTime() > Date.now()) {
        status = "HELD_IN_PAYMENT";
      } else if (!b.payment && (Date.now() - new Date(b.createdAt).getTime() < 60000)) {
        status = "HELD_IN_PAYMENT"; // 60s grace period
      } else {
        status = "EXPIRED_OR_AVAILABLE";
      }
    }
    return { time, status };
  }).filter((s: any) => s.status !== "EXPIRED_OR_AVAILABLE");

  // Keep bookedTimes for backward compatibility, but provide slotStates
  const bookedTimes = slotStates.map((s: any) => s.time);

  return NextResponse.json({ bookedTimes, slotStates });
});
