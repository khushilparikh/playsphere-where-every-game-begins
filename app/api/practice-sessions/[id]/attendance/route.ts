import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// POST /api/practice-sessions/:id/attendance { userId, present }
// Captain marks a team member present/absent for a practice session.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const session = await prisma.practiceSession.findUnique({
    where: { id: params.id },
    include: { team: { include: { members: true } } },
  });
  if (!session) return jsonError("Practice session not found", 404);

  const body = await req.json().catch(() => ({}));
  if (!body?.userId) return jsonError("userId is required");

  const isCaptain = session.team.captainId === user.id;
  const isSelf = body.userId === user.id;
  const isMember = session.team.members.some((m) => m.userId === user.id);
  if (!isCaptain && !(isSelf && isMember)) {
    return jsonError("Only the captain can mark attendance for someone else", 403);
  }

  const attendance = await prisma.practiceAttendance.upsert({
    where: { sessionId_userId: { sessionId: params.id, userId: body.userId } },
    update: { present: body.present ?? true },
    create: { sessionId: params.id, userId: body.userId, present: body.present ?? true },
  });

  return NextResponse.json({ attendance });
});
