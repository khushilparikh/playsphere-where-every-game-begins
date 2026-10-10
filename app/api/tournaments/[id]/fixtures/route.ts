import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/tournaments/:id/fixtures
// Builds a simple single-elimination bracket from the tournament's
// APPROVED teams. Nothing is persisted — the bracket is derived fresh
// each time from the current list of approved registrations, ordered by
// the time they were approved, so it always reflects reality and never
// goes stale.
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      registrations: {
        where: { status: "APPROVED" },
        include: { team: true },
        orderBy: { submittedAt: "asc" },
      },
    },
  });
  if (!tournament) return jsonError("Tournament not found", 404);

  const teams = tournament.registrations.map((r) => ({ id: r.teamId, name: r.team.name }));

  if (teams.length < 2) {
    return NextResponse.json({
      teams: teams.length,
      rounds: [],
      message:
        teams.length === 0
          ? "No teams have been approved yet — approve a few registrations to generate fixtures."
          : "Approve at least one more team to generate the first round.",
    });
  }

  // Round 1 pairs teams in registration order; a lone leftover team gets a bye.
  const round1: { a: { id: string; name: string }; b: { id: string; name: string } | null }[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    round1.push({ a: teams[i], b: teams[i + 1] ?? null });
  }

  const rounds = [{ name: "Round 1", matches: round1 }];
  let remaining = round1.length;
  let roundNum = 2;
  while (remaining > 1) {
    const matches = Math.ceil(remaining / 2);
    rounds.push({
      name: remaining === 2 ? "Final" : remaining <= 4 ? "Semi-Final" : `Round ${roundNum}`,
      matches: Array.from({ length: matches }, () => ({ a: null as any, b: null as any, tbd: true })),
    });
    remaining = matches;
    roundNum += 1;
  }

  return NextResponse.json({ teams: teams.length, rounds });
});
