import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/tournaments/:id/analytics
// Task 55, Phase 6: registrations-over-time and status breakdown for the
// organizer — Tournament.revenueCollected is already a running total
// (used as-is here), but nothing showed *when* registrations came in.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) return jsonError("Tournament not found", 404);
  if (tournament.organizerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const registrations = await prisma.teamRegistration.findMany({
    where: { tournamentId: params.id },
    select: { submittedAt: true, status: true },
  });

  const byDay = new Map<string, number>();
  for (const r of registrations) {
    const day = r.submittedAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const series = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const approved = registrations.filter((r: (typeof registrations)[number]) => r.status === "APPROVED").length;
  const pending = registrations.filter((r: (typeof registrations)[number]) => r.status === "PENDING").length;
  const rejected = registrations.filter((r: (typeof registrations)[number]) => r.status === "REJECTED").length;

  return NextResponse.json({
    series,
    totalRegistrations: registrations.length,
    approved,
    pending,
    rejected,
    revenueCollected: tournament.revenueCollected,
  });
});
