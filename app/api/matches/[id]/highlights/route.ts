import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializeHighlight(h: any) {
  return { id: h.id, matchId: h.matchId, image: h.image, caption: h.caption, createdAt: h.createdAt };
}

// GET /api/matches/:id/highlights
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const highlights = await prisma.matchHighlight.findMany({
    where: { matchId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ highlights: highlights.map(serializeHighlight) });
});

// POST /api/matches/:id/highlights  { image, caption? }
// Task 42, Phase 6: any authenticated user can add a highlight photo once
// the match has ended — same open-by-design posture as match scoring
// (see events/route.ts), not restricted to whoever started the match.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const match = await prisma.liveMatch.findUnique({ where: { id: params.id } });
  if (!match) return jsonError("Match not found", 404);
  if (match.status !== "FT") return jsonError("Highlights can only be added once the match has finished.");

  const body = await req.json().catch(() => null);
  if (!body?.image) return jsonError("image is required");

  const highlight = await prisma.matchHighlight.create({
    data: { matchId: params.id, image: body.image, caption: body.caption || null },
  });

  return NextResponse.json({ highlight: serializeHighlight(highlight) }, { status: 201 });
});
