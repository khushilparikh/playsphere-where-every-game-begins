import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { logAudit } from "@/lib/audit";

// PATCH /api/admin/approvals/:id  { approve: boolean, type: "Venue"|"Trainer"|"Academy" }
// Verifies or rejects a venue/trainer/academy listing. `type` is required
// since ids come from three different tables (Task 6, Phase 2 — extends
// the venue-only approval flow to trainers and academies).
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const nextStatus = body.approve ? "ACTIVE" : "UNDER_REVIEW";

  if (body.type === "Trainer") {
    const trainer = await prisma.trainerProfile.update({
      where: { id: params.id },
      data: { status: nextStatus },
      include: { user: true },
    });
    logAudit(user.id, "ADMIN", body.approve ? "TRAINER_ACTIVATED" : "TRAINER_SUSPENDED", "TrainerProfile", trainer.id, trainer.user.name, "ADMIN");
    return NextResponse.json({ ok: true, trainer });
  }

  if (body.type === "Academy") {
    const academy = await prisma.academy.update({
      where: { id: params.id },
      data: { status: nextStatus },
    });
    logAudit(user.id, "ADMIN", body.approve ? "ACADEMY_ACTIVATED" : "ACADEMY_SUSPENDED", "Academy", academy.id, academy.name, "ADMIN");
    return NextResponse.json({ ok: true, academy });
  }

  // Default / "Venue" — preserves the original behavior for existing callers.
  const venue = await prisma.venue.update({
    where: { id: params.id },
    data: { status: nextStatus },
  });
  logAudit(user.id, "ADMIN", body.approve ? "VENUE_ACTIVATED" : "VENUE_SUSPENDED", "Venue", venue.id, venue.name, "ADMIN");
  return NextResponse.json({ ok: true, venue });
});
