import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandling, SPORT_FROM_DB } from "@/lib/api-format";
import { estimateWinProbability } from "@/lib/sport-scoring";

// GET /api/matches/:id/stats -> derived stats + heuristic win probability
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const match = await prisma.liveMatch.findUnique({ where: { id: params.id } });
  if (!match) return jsonError("Match not found", 404);

  const events = await prisma.matchEvent.findMany({
    where: { matchId: params.id },
    orderBy: { sequence: "asc" },
  });

  const sport = SPORT_FROM_DB[match.sport] ?? match.sport;

  // Event-type breakdown (e.g. how many FOUR/SIX/WICKET/GOAL/POINT etc.)
  const eventTypeCounts: Record<string, number> = {};
  for (const e of events) {
    eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] ?? 0) + 1;
  }

  // Score progression — one point per event, for a simple sparkline.
  const progression = events.map((e) => ({ sequence: e.sequence, scoreA: e.scoreA, scoreB: e.scoreB }));

  // Team split (how many logged events belong to each side) — a rough
  // proxy for "who's dominating the passage of play" across sports.
  const teamACount = events.filter((e) => e.team === "A").length;
  const teamBCount = events.filter((e) => e.team === "B").length;

  const winProbabilityA = estimateWinProbability(sport, match.scoreA, match.scoreB, events.length);

  return NextResponse.json({
    stats: {
      totalEvents: events.length,
      eventTypeCounts,
      progression,
      teamActivity: { teamA: teamACount, teamB: teamBCount },
      winProbability: { teamA: winProbabilityA, teamB: 100 - winProbabilityA },
      isHeuristic: true, // flagged explicitly — this is a statistical estimate, not a trained model
    },
  });
});
