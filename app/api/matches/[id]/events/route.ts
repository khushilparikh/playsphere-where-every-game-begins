import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { emitEvent } from "@/lib/socket-emit";

function serializeMatchEvent(e: any) {
  return {
    id: e.id,
    matchId: e.matchId,
    sequence: e.sequence,
    marker: e.marker,
    eventType: e.eventType,
    team: e.team ?? null,
    description: e.description,
    scoreA: e.scoreA,
    scoreB: e.scoreB,
    x: e.x ?? null,
    y: e.y ?? null,
    createdAt: e.createdAt,
  };
}

// GET /api/matches/:id/events -> full ball-by-ball / point-by-point log, oldest first
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const events = await prisma.matchEvent.findMany({
    where: { matchId: params.id },
    orderBy: { sequence: "asc" },
  });
  return NextResponse.json({ events: events.map(serializeMatchEvent) });
});

// POST /api/matches/:id/events { marker, eventType, description, scoreA, scoreB, team?, x?, y? }
// Also updates the match's live score to match the latest event, and
// broadcasts both over Socket.IO so spectators see it instantly.
// Open to any authenticated user — Player, Organizer, Venue Owner, Trainer
// or Admin can all start and score a match (see the Start Match flow).
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const match = await prisma.liveMatch.findUnique({ where: { id: params.id } });
  if (!match) return jsonError("Match not found", 404);

  const body = await req.json().catch(() => ({}));
  if (!body?.marker || !body?.description) return jsonError("marker and description are required");

  const lastEvent = await prisma.matchEvent.findFirst({
    where: { matchId: params.id },
    orderBy: { sequence: "desc" },
  });

  const scoreA = body.scoreA ?? match.scoreA;
  const scoreB = body.scoreB ?? match.scoreB;

  const event = await prisma.matchEvent.create({
    data: {
      matchId: params.id,
      sequence: (lastEvent?.sequence ?? 0) + 1,
      marker: body.marker,
      eventType: body.eventType || "UPDATE",
      team: body.team ?? null,
      description: body.description,
      scoreA,
      scoreB,
      x: typeof body.x === "number" ? body.x : undefined,
      y: typeof body.y === "number" ? body.y : undefined,
    },
  });

  const updatedMatch = await prisma.liveMatch.update({
    where: { id: params.id },
    data: { scoreA, scoreB, meta: body.marker },
  });

  emitEvent("match:event", serializeMatchEvent(event));
  emitEvent("match:update", { id: updatedMatch.id, scoreA, scoreB, meta: body.marker });

  return NextResponse.json({ event: serializeMatchEvent(event) }, { status: 201 });
});
