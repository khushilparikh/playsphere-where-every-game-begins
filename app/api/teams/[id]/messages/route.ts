import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeChatMessage } from "@/lib/serializers";

async function requireMember(userId: string, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return { error: jsonError("Team not found", 404) };
  const isMember = team.captainId === userId || team.members.some((m) => m.userId === userId);
  if (!isMember) return { error: jsonError("Forbidden", 403) };
  return { team };
}

// GET /api/teams/:id/messages -> latest 100 messages, oldest first
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { error } = await requireMember(user.id, params.id);
  if (error) return error;

  const messages = await prisma.chatMessage.findMany({
    where: { teamId: params.id },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ messages: messages.map(serializeChatMessage) });
});

// POST /api/teams/:id/messages { content?, attachmentUrl? }
// Task 32, Phase 6: attachmentUrl is optional and additive — a message
// can be text, an image, or both, matching how community posts already
// allow text-and/or-image.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { error } = await requireMember(user.id, params.id);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const content = body?.content?.trim() ?? "";
  const attachmentUrl = typeof body?.attachmentUrl === "string" ? body.attachmentUrl : undefined;
  if (!content && !attachmentUrl) return jsonError("Message needs text or an attachment");

  const message = await prisma.chatMessage.create({
    data: { teamId: params.id, senderId: user.id, content, attachmentUrl },
    include: { sender: true },
  });

  return NextResponse.json({ message: serializeChatMessage(message) }, { status: 201 });
});
