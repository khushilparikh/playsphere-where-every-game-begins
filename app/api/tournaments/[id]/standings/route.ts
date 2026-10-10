import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { computeStandings } from "@/lib/standings";

// GET /api/tournaments/:id/standings
// Only meaningful for bracketType "LEAGUE" — for "KNOCKOUT" tournaments,
// use GET /api/tournaments/:id/fixtures (already existing bracket
// generation) instead. See lib/standings.ts for how results are matched.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) return jsonError("Tournament not found", 404);
  if (tournament.bracketType !== "LEAGUE") {
    return jsonError('Standings are only available for "LEAGUE" format tournaments. Use /fixtures for knockout brackets.');
  }

  const [registrations, matches] = await Promise.all([
    prisma.teamRegistration.findMany({
      where: { tournamentId: params.id, status: "APPROVED" },
      include: { team: true },
    }),
    prisma.liveMatch.findMany({
      where: { tournamentId: params.id, status: "FT" },
      select: { teamA: true, teamB: true, scoreA: true, scoreB: true },
    }),
  ]);

  const standings = computeStandings(
    registrations.map((r: (typeof registrations)[number]) => ({ id: r.teamId, name: r.team.name })),
    matches
  );

  return NextResponse.json({ standings });
});
