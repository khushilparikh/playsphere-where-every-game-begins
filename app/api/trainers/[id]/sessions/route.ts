import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { notifyUser } from "@/lib/notify";

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

// GET /api/trainers/:id/sessions
// Returns the trainer's own session calendar if the caller owns the
// profile (or is admin); otherwise returns just the caller's own sessions
// with this trainer.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);

  const isOwner = trainer.userId === user.id || user.role === "ADMIN";
  const sessions = await prisma.trainingSession.findMany({
    where: isOwner ? { trainerId: params.id } : { trainerId: params.id, studentId: user.id },
    include: { trainer: { include: { user: true } }, student: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json({ sessions: sessions.map(serializeSession) });
});

// POST /api/trainers/:id/sessions { date, time, mode?, meetingLink?, notes?, purchaseId? }
// A student books a session with this trainer. If purchaseId is given, it
// must be one of the student's own active, unexhausted package purchases
// for this trainer, and consumes one credit from it.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);
  if (trainer.userId === user.id) return jsonError("You can't book a session with yourself", 400);

  const body = await req.json().catch(() => ({}));
  if (!body?.date || !body?.time) return jsonError("date and time are required");

  let purchase = null;
  if (body.purchaseId) {
    purchase = await prisma.packagePurchase.findUnique({ where: { id: body.purchaseId }, include: { package: true } });
    if (!purchase || purchase.studentId !== user.id || purchase.package.trainerId !== params.id) {
      return jsonError("Invalid package purchase", 400);
    }
    if (purchase.sessionsUsed >= purchase.package.sessionCount) return jsonError("No sessions remaining on this package", 400);
    if (new Date(purchase.expiresAt) < new Date()) return jsonError("This package has expired", 400);
  }

  const session = await prisma.trainingSession.create({
    data: {
      trainerId: params.id,
      studentId: user.id,
      purchaseId: purchase?.id,
      date: body.date,
      time: body.time,
      mode: (body.mode ?? purchase?.package.mode ?? "OFFLINE").toUpperCase(),
      meetingLink: body.meetingLink || null,
      notes: body.notes || null,
    },
    include: { trainer: { include: { user: true } }, student: true },
  });

  if (purchase) {
    await prisma.packagePurchase.update({ where: { id: purchase.id }, data: { sessionsUsed: { increment: 1 } } });
  }

  await notifyUser({
    userId: trainer.userId,
    title: "New session booked",
    detail: `${user.name} booked a session for ${body.date} at ${body.time}`,
    type: "COMMUNITY",
  });

  return NextResponse.json({ session: serializeSession(session) }, { status: 201 });
});
