import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandling, SPORT_FROM_DB } from "@/lib/api-format";

// GET /api/teams/:id/public-profile
//
// Task 23, Phase 5: a shareable, read-only team profile — unlike
// GET /api/teams/:id (member-only, used by the Roster management modal
// and includes each member's email), this is intentionally public and
// strips anything account-related, just names, roles, and the team's
// record.
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } }, captain: true },
  });
  if (!team) return jsonError("Team not found", 404);

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      sport: SPORT_FROM_DB[team.sport] ?? team.sport,
      wins: team.wins,
      losses: team.losses,
      logo: team.logo ?? null,
      logoColor: team.logoColor,
      captainName: team.captain.name,
      members: team.members.map((m: (typeof team.members)[number]) => ({ id: m.id, name: m.user.name, roleName: m.roleName })),
    },
  });
});
