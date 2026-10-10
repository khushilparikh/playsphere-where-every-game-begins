import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { notifyUser } from "@/lib/notify";

// POST /api/sessions/:id/reschedule { proposedDate, proposedTime, reason? }
// Either the student or the trainer can propose a new time; the other
// party then approves or rejects it via PATCH on this same route.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const session = await prisma.trainingSession.findUnique({
    where: { id: params.id },
    include: { trainer: true },
  });
  if (!session) return jsonError("Session not found", 404);
  if (session.studentId !== user.id && session.trainer.userId !== user.id && user.role !== "ADMIN") {
    return jsonError("Forbidden", 403);
  }
  if (session.status !== "SCHEDULED") return jsonError("Only a scheduled session can be rescheduled", 400);

  const body = await req.json().catch(() => ({}));
  if (!body?.proposedDate || !body?.proposedTime) return jsonError("proposedDate and proposedTime are required");

  const updated = await prisma.trainingSession.update({
    where: { id: params.id },
    data: {
      rescheduleStatus: "PENDING",
      proposedDate: body.proposedDate,
      proposedTime: body.proposedTime,
      rescheduleReason: body.reason || null,
      rescheduleByUserId: user.id,
    },
  });

  const notifyUserId = session.studentId === user.id ? session.trainer.userId : session.studentId;
  await notifyUser({
    userId: notifyUserId,
    title: "Reschedule requested",
    detail: `New proposed time: ${body.proposedDate} at ${body.proposedTime}`,
    type: "COMMUNITY",
  });

  return NextResponse.json({ session: updated });
});

// PATCH /api/sessions/:id/reschedule { approve: boolean }
// The other party (whoever didn't propose it) accepts or rejects.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const session = await prisma.trainingSession.findUnique({
    where: { id: params.id },
    include: { trainer: true },
  });
  if (!session) return jsonError("Session not found", 404);
  if (session.rescheduleStatus !== "PENDING") return jsonError("No pending reschedule request", 400);
  if (session.rescheduleByUserId === user.id) return jsonError("You can't approve your own reschedule request", 400);
  if (session.studentId !== user.id && session.trainer.userId !== user.id && user.role !== "ADMIN") {
    return jsonError("Forbidden", 403);
  }

  const body = await req.json().catch(() => ({}));

  const updated = await prisma.trainingSession.update({
    where: { id: params.id },
    data: body.approve
      ? {
          date: session.proposedDate!,
          time: session.proposedTime!,
          rescheduleStatus: "APPROVED",
          proposedDate: null,
          proposedTime: null,
        }
      : {
          rescheduleStatus: "REJECTED",
          proposedDate: null,
          proposedTime: null,
        },
  });

  const notifyUserId = session.rescheduleByUserId!;
  await notifyUser({
    userId: notifyUserId,
    title: body.approve ? "Reschedule approved" : "Reschedule declined",
    detail: body.approve ? `New time: ${updated.date} at ${updated.time}` : "Your proposed time was declined.",
    type: "COMMUNITY",
  });

  return NextResponse.json({ session: updated });
});
