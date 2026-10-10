import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/venues/:id/analytics
// Task 54, Phase 6: real trend data for the venue owner, aggregating
// Booking rows by week over the last ~12 weeks — the denormalized
// counters on Venue (bookingsToday, revenueThisMonth) are point-in-time
// snapshots, not a trend, so this computes a proper weekly series
// instead of reusing them.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const venue = await prisma.venue.findUnique({ where: { id: params.id } });
  if (!venue) return jsonError("Venue not found", 404);
  if (venue.ownerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({
    where: { venueId: params.id, createdAt: { gte: twelveWeeksAgo } },
    select: { createdAt: true, amount: true, status: true },
  });

  // Bucket into ISO-week labels ("2026-W03") so weeks always sort
  // correctly regardless of month/year boundaries.
  function weekKey(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  }

  const byWeek = new Map<string, { week: string; bookings: number; confirmedRevenue: number }>();
  for (const b of bookings) {
    const key = weekKey(b.createdAt);
    const entry = byWeek.get(key) ?? { week: key, bookings: 0, confirmedRevenue: 0 };
    entry.bookings += 1;
    if (b.status === "CONFIRMED") entry.confirmedRevenue += b.amount;
    byWeek.set(key, entry);
  }

  const series = Array.from(byWeek.values()).sort((a, b) => a.week.localeCompare(b.week));
  const totalBookings = bookings.length;
  const confirmed = bookings.filter((b: (typeof bookings)[number]) => b.status === "CONFIRMED").length;
  const confirmationRate = totalBookings > 0 ? Math.round((confirmed / totalBookings) * 100) : 0;

  return NextResponse.json({ series, totalBookings, confirmationRate });
});
