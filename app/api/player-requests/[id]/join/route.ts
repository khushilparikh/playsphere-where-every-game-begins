import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeJoinRequest } from "@/lib/serializers";
import { notifyUser } from "@/lib/notify";

// GET /api/player-requests/:id/join  -> the request creator's list of join
// requests (accepted/declined/pending), for the Accept/Decline UI.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const request_ = await prisma.playerRequest.findUnique({ where: { id: params.id } });
  if (!request_) return jsonError("Player request not found", 404);
  if (request_.postedById !== user.id) return jsonError("Only the request creator can view this", 403);

  const joinRequests = await prisma.playerRequestJoin.findMany({
    where: { requestId: params.id },
    include: { requester: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ joinRequests: joinRequests.map(serializeJoinRequest) });
});

// POST /api/player-requests/:id/join { message? }
// A player asks to join someone else's "need players" post.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const request_ = await prisma.playerRequest.findUnique({ where: { id: params.id } });
  if (!request_) return jsonError("Player request not found", 404);
  if (request_.postedById === user.id) return jsonError("You can't join your own request", 400);

  const body = await req.json().catch(() => ({}));

  const existing = await prisma.playerRequestJoin.findUnique({
    where: { requestId_requesterId: { requestId: params.id, requesterId: user.id } },
  });
  if (existing) return jsonError("You already requested to join this match.", 409);

  const join = await prisma.playerRequestJoin.create({
    data: { requestId: params.id, requesterId: user.id, message: body.message ?? null },
    include: { requester: true },
  });

  await notifyUser({
    userId: request_.postedById,
    title: "New player wants to join",
    detail: `${user.name} requested to join "${request_.title}"`,
    type: "COMMUNITY",
  });

  return NextResponse.json({ joinRequest: serializeJoinRequest(join) }, { status: 201 });
});
