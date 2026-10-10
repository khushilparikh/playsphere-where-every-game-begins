import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, LEVEL_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializePlayerRequest } from "@/lib/serializers";
import { logAudit } from "@/lib/audit";

// GET /api/player-requests?sport=Football  -> open "need players" posts
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const user = await getAuthUser(req);

  const requests = await prisma.playerRequest.findMany({
    where: sport && sport !== "All" ? { sport: (SPORT_TO_DB[sport] ?? sport) as any } : {},
    include: { postedBy: true, joinRequests: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...serializePlayerRequest(r),
      pendingJoinRequests: r.joinRequests.filter((j) => j.status === "PENDING").length,
      myJoinStatus: user ? r.joinRequests.find((j) => j.requesterId === user.id)?.status ?? null : null,
    })),
  });
});

// POST /api/player-requests  -> publish a new "need players" request
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.sport || !body?.area || !body?.date) {
    return jsonError("title, sport, area and date are required");
  }

  const request_ = await prisma.playerRequest.create({
    data: {
      postedById: user.id,
      title: body.title,
      sport: (SPORT_TO_DB[body.sport] ?? body.sport) as any,
      area: body.area,
      date: body.date,
      playersNeeded: body.playersNeeded ?? 1,
      level: (LEVEL_TO_DB[body.level] ?? "INTERMEDIATE") as any,
    },
    include: { postedBy: true },
  });

  logAudit(user.id, "PLAYER_REQUEST", "PLAYER_REQUEST_CREATED", "PlayerRequest", request_.id, request_.title, user.role);

  return NextResponse.json({ request: serializePlayerRequest(request_) }, { status: 201 });
});
