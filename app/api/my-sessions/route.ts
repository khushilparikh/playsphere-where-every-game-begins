import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializeSession(s: any) {
  return {
    id: s.id,
    trainerId: s.trainerId,
    trainerName: s.trainer?.user?.name,
    studentId: s.studentId,
    studentName: s.student?.name,
    purchaseId: s.purchaseId,
    date: s.date,
    time: s.time,
    mode: s.mode?.charAt(0) + s.mode?.slice(1).toLowerCase(),
    meetingLink: s.meetingLink,
    notes: s.notes,
    status: s.status,
    rescheduleStatus: s.rescheduleStatus,
    proposedDate: s.proposedDate,
    proposedTime: s.proposedTime,
    rescheduleReason: s.rescheduleReason,
    rescheduleByUserId: s.rescheduleByUserId,
    createdAt: s.createdAt,
  };
}

// GET /api/my-sessions -> the logged-in user's own sessions, as a student
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const sessions = await prisma.trainingSession.findMany({
    where: { studentId: user.id },
    include: { trainer: { include: { user: true } }, student: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json({ sessions: sessions.map(serializeSession) });
});
