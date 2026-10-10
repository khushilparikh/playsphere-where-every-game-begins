import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeMessage } from "@/lib/serializers";
import { emitToUser } from "@/lib/socket-emit";

const MAX_MESSAGE_LENGTH = 2000;

// GET /api/messages/:userId -> the full thread between the current user
// and :userId, oldest first. Marks any unread messages *from* that user
// as read as a side effect (opening the thread is "reading" it).
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { userId: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (params.userId === user.id) return jsonError("Can't message yourself", 400);

  const other = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!other) return jsonError("User not found", 404);

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { fromId: user.id, toId: params.userId },
        { fromId: params.userId, toId: user.id },
      ],
    },
    include: { from: true, to: true },
    orderBy: { createdAt: "asc" },
  });

  await prisma.directMessage.updateMany({
    where: { fromId: params.userId, toId: user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ messages: messages.map(serializeMessage) });
});

// POST /api/messages/:userId  { content }
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { userId: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (params.userId === user.id) return jsonError("Can't message yourself", 400);

  const other = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!other) return jsonError("User not found", 404);

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return jsonError("Message can't be empty");
  if (content.length > MAX_MESSAGE_LENGTH) return jsonError(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);

  const message = await prisma.directMessage.create({
    data: { fromId: user.id, toId: params.userId, content },
    include: { from: true, to: true },
  });

  const serialized = serializeMessage(message);
  // Task 21 reuses the same per-user Socket.IO room set up for
  // notifications (Task 14, Phase 4) — no separate real-time plumbing
  // needed, just a different event name so the client can tell them apart.
  emitToUser(params.userId, "message:new", serialized);

  return NextResponse.json({ message: serialized }, { status: 201 });
});
