import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeBooking } from "@/lib/serializers";
import { awardXp, awardBadge, XP_REWARDS } from "@/lib/gamification";
import { validate } from "@/lib/validation/validate";
import { createBookingSchema } from "@/lib/validation/booking";
import { notifyUser } from "@/lib/notify";
import { formatSlot, addWeeksToDate, calculateSlotDurationAndAmount, doSlotsOverlap } from "@/lib/booking-slot";
import { randomUUID } from "crypto";
import { logAudit } from "@/lib/audit";

// GET /api/bookings                -> bookings made by the logged-in user
// GET /api/bookings?forOwner=true  -> pending requests across venues the logged-in Venue Owner owns
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { searchParams } = new URL(req.url);
  const forOwner = searchParams.get("forOwner") === "true";

  const bookings = forOwner
    ? await prisma.booking.findMany({
        where: { venue: { ownerId: user.id }, status: "PENDING" },
        include: { venue: true, user: true },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.booking.findMany({
        where: { userId: user.id },
        include: { venue: true, user: true },
        orderBy: { createdAt: "desc" },
      });

  return NextResponse.json({ bookings: bookings.map(serializeBooking) });
});

// POST /api/bookings  -> a player/organizer books a venue slot
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return jsonError("Invalid JSON body");

  // Task 7, Phase 2: schema-validated instead of ad-hoc `if (!body?.x)`
  // checks — see lib/validation/booking.ts for the full shape/limits.
  const parsed = validate(createBookingSchema, rawBody);
  if (parsed instanceof Response) return parsed;
  const body = parsed;

  const venue = await prisma.venue.findUnique({ where: { id: body.venueId } });
  if (!venue) return jsonError("Venue not found", 404);

  const weeks = body.recurrenceWeeks ?? 1;
  if (weeks > 1 && (!body.date || !body.time)) {
    return jsonError("date and time are required to create a recurring booking series");
  }
  const recurrenceGroupId = weeks > 1 ? randomUUID() : undefined;

  const created: any[] = [];
  const skipped: string[] = [];
  let booking: any;

  for (let i = 0; i < weeks; i++) {
    // First occurrence uses the exact `slot` string sent by the client
    // (unchanged single-booking behavior); later occurrences in a
    // recurring series are generated from date+time so each week's date
    // advances correctly — see lib/booking-slot.ts.
    const occurrenceSlot = i === 0 ? body.slot.trim() : formatSlot(addWeeksToDate(body.date!, i), body.time!);

    const { totalAmount } = calculateSlotDurationAndAmount(occurrenceSlot, venue.pricePerHour);

    const activeBookings = await prisma.booking.findMany({
      where: {
        venueId: body.venueId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: { payment: true }
    });

    const isConflicting = activeBookings.some((b: any) => {
      if (!doSlotsOverlap(b.slot, occurrenceSlot)) return false;
      
      if (b.status === "CONFIRMED") return true;
      
      if (b.status === "PENDING") {
         if (b.paymentStatus === "SUCCESS") return true; // Paid but waiting for owner approval
         if (b.payment && new Date(b.payment.expiresAt).getTime() > Date.now()) {
            return true; // Active payment lock
         }
         if (!b.payment) {
            // No payment initiated yet. Give a 60-second grace period for the client to call /initiate
            const ageMs = Date.now() - new Date(b.createdAt).getTime();
            if (ageMs < 60000) return true;
         }
      }
      return false;
    });

    if (isConflicting) {
      skipped.push(occurrenceSlot);
      continue;
    }

    const created_ = await prisma.booking.create({
      data: {
        venueId: body.venueId,
        userId: user.id,
        sport: (SPORT_TO_DB[body.sport] ?? body.sport) as any,
        slot: occurrenceSlot,
        amount: totalAmount,
        status: "PENDING",
        recurrenceGroupId,
      },
      include: { venue: true, user: true },
    });
    created.push(created_);
    logAudit(user.id, "BOOKING", "BOOKING_REQUESTED", "Booking", created_.id, created_.slot, user.role);
    if (i === 0) booking = created_;
  }

  if (!booking) {
    // Only possible if the very first (non-recurring-derived) occurrence
    // conflicted — the slot-conflict check below already covers that
    // message for the single-booking case, but recurring series can also
    // fail entirely if week 0 collides.
    return jsonError("That slot already has a pending or confirmed booking. Please choose a different time.", 409);
  }

  for (const b of created) {
    await notifyUser({
      userId: venue.ownerId,
      title: "New booking request",
      detail: `${user.name} requested ${venue.name} · ${b.slot}`,
      type: "BOOKING",
    });
  }

  await awardXp(user.id, XP_REWARDS.VENUE_BOOKED);
  await awardBadge(user.id, "FIRST_BOOKING");

  return NextResponse.json(
    {
      booking: serializeBooking(booking),
      recurrence: weeks > 1 ? { created: created.length, skipped } : undefined,
    },
    { status: 201 }
  );
});
