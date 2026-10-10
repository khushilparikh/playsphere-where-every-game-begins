import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// POST /api/students/:id/attendance  { date, present }
// :id is a StudentEnrollment id. Trainer-only (the trainer who owns the
// batch this student is enrolled in). Task 38, Phase 6: real per-session
// attendance records, replacing StudentEnrollment.attendance being the
// only signal (that field now gets recomputed from these rows as a
// running summary %, same pattern as recomputeTrainerRating).
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: params.id },
    include: { batch: { include: { trainer: true } } },
  });
  if (!enrollment) return jsonError("Enrollment not found", 404);
  if (enrollment.batch.trainer.userId !== user.id) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const date = typeof body.date === "string" ? body.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError("date must be YYYY-MM-DD");
  const present = body.present !== false;

  await prisma.batchAttendance.upsert({
    where: { enrollmentId_date: { enrollmentId: params.id, date } },
    update: { present },
    create: { enrollmentId: params.id, date, present },
  });

  const records = await prisma.batchAttendance.findMany({ where: { enrollmentId: params.id } });
  const attendancePct = records.length > 0 ? Math.round((records.filter((r: (typeof records)[number]) => r.present).length / records.length) * 100) : 100;

  const updated = await prisma.studentEnrollment.update({
    where: { id: params.id },
    data: { attendance: attendancePct },
  });

  return NextResponse.json({ attendance: updated.attendance, records: records.length });
});
