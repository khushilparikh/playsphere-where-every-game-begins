import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeMatch } from "@/lib/serializers";
import { emitEvent } from "@/lib/socket-emit";

// GET /api/matches?status=LIVE               -> live scoreboard list
// GET /api/matches?tournamentId=xyz           -> Task 29: this tournament's scheduled/live/finished matches
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tournamentId = searchParams.get("tournamentId");

  const matches = await prisma.liveMatch.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(tournamentId ? { tournamentId } : {}),
    },
    include: { venue: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ matches: matches.map(serializeMatch) });
});

// POST /api/matches  -> Start a match (Player, Organizer, Venue Owner, Trainer or Admin)
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.sport || !body?.teamA || !body?.teamB) return jsonError("sport, teamA and teamB are required");

  const match = await prisma.liveMatch.create({
    data: {
      sport: (SPORT_TO_DB[body.sport] ?? body.sport) as any,
      teamA: body.teamA,
      teamB: body.teamB,
      scoreA: body.scoreA || "-",
      scoreB: body.scoreB || "-",
      status: body.status || "UPCOMING",
      meta: body.meta,
      venueId: body.venueId || undefined,
      tournamentId: body.tournamentId || undefined,
      startedById: user.id,
    },
    include: { venue: true },
  });

  const serialized = serializeMatch(match);
  emitEvent("match:created", serialized);
  return NextResponse.json({ match: serialized }, { status: 201 });
});
