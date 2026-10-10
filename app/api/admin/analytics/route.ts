import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/admin/analytics
// Task 56, Phase 6: platform-wide trends over the last 12 weeks — signups,
// bookings, and tournaments created — grouped by week. The Admin Console
// already showed point-in-time totals (StatCards); this adds the "over
// time" view those don't provide.
function weekKey(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function bucketByWeek(dates: Date[]): Record<string, number> {
  const buckets: Record<string, number> = {};
  for (const d of dates) {
    const key = weekKey(d);
    buckets[key] = (buckets[key] ?? 0) + 1;
  }
  return buckets;
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);

  const [users, bookings, tournaments] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true } }),
    prisma.booking.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true } }),
    prisma.tournament.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true } }),
  ]);

  const signupsByWeek = bucketByWeek(users.map((u: (typeof users)[number]) => u.createdAt));
  const bookingsByWeek = bucketByWeek(bookings.map((b: (typeof bookings)[number]) => b.createdAt));
  const tournamentsByWeek = bucketByWeek(tournaments.map((t: (typeof tournaments)[number]) => t.createdAt));

  const allWeeks = Array.from(new Set([...Object.keys(signupsByWeek), ...Object.keys(bookingsByWeek), ...Object.keys(tournamentsByWeek)])).sort();

  const series = allWeeks.map((week) => ({
    week,
    signups: signupsByWeek[week] ?? 0,
    bookings: bookingsByWeek[week] ?? 0,
    tournaments: tournamentsByWeek[week] ?? 0,
  }));

  return NextResponse.json({
    series,
    totals: { signups: users.length, bookings: bookings.length, tournaments: tournaments.length },
  });
});
