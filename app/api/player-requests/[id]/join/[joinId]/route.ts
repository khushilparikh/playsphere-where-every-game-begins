import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeJoinRequest } from "@/lib/serializers";
import { notifyUser } from "@/lib/notify";

// PATCH /api/player-requests/:id/join/:joinId  { status: "ACCEPTED" | "DECLINED" }
// Task 9, Phase 3 — lets the Player Finder request's creator accept or
// decline a specific requester, instead of join requests just sitting as
// PENDING forever with no resolution.
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string; joinId: string } }) => {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);

    const request_ = await prisma.playerRequest.findUnique({ where: { id: params.id } });
    if (!request_) return jsonError("Player request not found", 404);
    if (request_.postedById !== user.id) {
      return jsonError("Only the request creator can accept or decline players", 403);
    }

    const join = await prisma.playerRequestJoin.findUnique({ where: { id: params.joinId } });
    if (!join || join.requestId !== params.id) return jsonError("Join request not found", 404);

    const body = await req.json().catch(() => null);
    if (body?.status !== "ACCEPTED" && body?.status !== "DECLINED") {
      return jsonError('status must be "ACCEPTED" or "DECLINED"');
    }

    const updated = await prisma.playerRequestJoin.update({
      where: { id: params.joinId },
      data: { status: body.status },
      include: { requester: true },
    });

    await notifyUser({
      userId: join.requesterId,
      title: body.status === "ACCEPTED" ? "You're in!" : "Request update",
      detail:
        body.status === "ACCEPTED"
          ? `${user.name} accepted your request to join "${request_.title}"`
          : `${user.name} couldn't fit you into "${request_.title}" this time`,
      type: "COMMUNITY",
    });

    return NextResponse.json({ joinRequest: serializeJoinRequest(updated) });
  }
);
