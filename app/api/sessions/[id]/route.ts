import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// PATCH /api/sessions/:id { status: "COMPLETED" | "CANCELLED", notes? }
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const session = await prisma.trainingSession.findUnique({ where: { id: params.id }, include: { trainer: true } });
  if (!session) return jsonError("Session not found", 404);

  const isTrainer = session.trainer.userId === user.id;
  const isStudent = session.studentId === user.id;
  if (!isTrainer && !isStudent && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  if (body.status && !["COMPLETED", "CANCELLED"].includes(body.status)) return jsonError("Invalid status");
  // Only the trainer (or admin) can mark a session complete; either side can cancel.
  if (body.status === "COMPLETED" && !isTrainer && user.role !== "ADMIN") {
    return jsonError("Only the trainer can mark a session complete", 403);
  }

  const updated = await prisma.trainingSession.update({
    where: { id: params.id },
    data: {
      status: body.status ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  return NextResponse.json({ session: updated });
});
