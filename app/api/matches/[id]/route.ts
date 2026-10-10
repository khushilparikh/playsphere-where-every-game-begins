import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeMatch } from "@/lib/serializers";
import { emitEvent } from "@/lib/socket-emit";

// PATCH /api/matches/:id  { scoreA, scoreB, meta, status, venueId }
// Updates a live score and broadcasts it over Socket.IO to every connected
// client subscribed to the "match:update" event. Open to any authenticated
// user, same as posting match events (see events/route.ts) — Player,
// Organizer, Venue Owner, Trainer or Admin can all run a match they started.
// `meta` and `venueId` double as Task 29's match-scheduling fields —
// an organizer editing an UPCOMING match's meta ("Sun 9:00 AM") or venue
// ahead of kickoff goes through this same endpoint, not a separate one.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => ({}));
  const match = await prisma.liveMatch.update({
    where: { id: params.id },
    data: {
      scoreA: body.scoreA ?? undefined,
      scoreB: body.scoreB ?? undefined,
      meta: body.meta ?? undefined,
      status: body.status ?? undefined,
      venueId: body.venueId ?? undefined,
    },
    include: { venue: true },
  });

  const serialized = serializeMatch(match);
  emitEvent("match:update", serialized);
  return NextResponse.json({ match: serialized });
});
