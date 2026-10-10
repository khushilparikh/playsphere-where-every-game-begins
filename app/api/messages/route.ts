import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/messages -> the current user's conversation list: one row per
// person they've exchanged a direct message with, most-recent first,
// with a preview of the last message and how many are unread from them.
//
// There's no dedicated "Conversation" table — a conversation is just the
// set of DirectMessage rows between two users — so this groups in
// application code rather than a SQL GROUP BY, which is simplest given
// Prisma's query builder and is fine at this data volume (a full inbox
// search/pagination system would revisit this).
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ fromId: user.id }, { toId: user.id }] },
    include: { from: true, to: true },
    orderBy: { createdAt: "desc" },
  });

  const conversations = new Map<
    string,
    { userId: string; name: string; avatar: string | null; lastMessage: string; lastMessageAt: Date; unread: number }
  >();

  for (const m of messages) {
    const other = m.fromId === user.id ? m.to : m.from;
    const existing = conversations.get(other.id);
    if (!existing) {
      conversations.set(other.id, {
        userId: other.id,
        name: other.name,
        avatar: other.avatar,
        lastMessage: m.content,
        lastMessageAt: m.createdAt,
        unread: m.toId === user.id && !m.read ? 1 : 0,
      });
    } else if (m.toId === user.id && !m.read) {
      existing.unread += 1;
    }
  }

  return NextResponse.json({ conversations: Array.from(conversations.values()) });
});
