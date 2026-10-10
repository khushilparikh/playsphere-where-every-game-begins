import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeVenue, serializeTrainer, serializeAcademy } from "@/lib/serializers";
import { logAudit } from "@/lib/audit";

// GET /api/admin/approvals  -> venues, trainers, and academies awaiting
// (or already given) moderation, merged into one list for the admin
// console. Venues go ACTIVE immediately when listed (existing behavior —
// admin can still suspend one here); trainers and academies default to
// UNDER_REVIEW and stay out of the public directory until approved
// (Task 5/6, Phase 2).
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const [venues, trainers, academies] = await Promise.all([
    prisma.venue.findMany({ include: { owner: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.trainerProfile.findMany({ include: { user: true }, orderBy: { id: "desc" }, take: 50 }),
    prisma.academy.findMany({ include: { owner: true }, orderBy: { id: "desc" }, take: 50 }),
  ]);

  const approvals = [
    ...venues.map((v) => ({
      ...serializeVenue(v),
      id: v.id,
      type: "Venue" as const,
      name: v.name,
      submittedBy: v.owner.name,
      submittedAt: v.createdAt,
    })),
    ...trainers.map((t) => ({
      ...serializeTrainer(t),
      id: t.id,
      type: "Trainer" as const,
      name: t.user.name,
      submittedBy: t.user.name,
      submittedAt: t.user.createdAt,
    })),
    ...academies.map((a) => ({
      ...serializeAcademy(a),
      id: a.id,
      type: "Academy" as const,
      name: a.name,
      submittedBy: a.owner.name,
      submittedAt: a.owner.createdAt,
    })),
  ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return NextResponse.json({ approvals });
});

// PATCH /api/admin/approvals  { ids: string[], type: "Venue"|"Trainer"|"Academy", approve: boolean }
// Task 51, Phase 6: batch version of PATCH /api/admin/approvals/:id —
// same per-item logic, looped via updateMany, so an admin clearing a
// backlog doesn't need to click each row individually.
export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return jsonError("ids array is required");
  if (ids.length > 100) return jsonError("Can't bulk-update more than 100 items at once");

  const nextStatus = body.approve ? "ACTIVE" : "UNDER_REVIEW";
  let updated = 0;

  if (body.type === "Trainer") {
    const result = await prisma.trainerProfile.updateMany({ where: { id: { in: ids } }, data: { status: nextStatus } });
    updated = result.count;
  } else if (body.type === "Academy") {
    const result = await prisma.academy.updateMany({ where: { id: { in: ids } }, data: { status: nextStatus } });
    updated = result.count;
  } else {
    const result = await prisma.venue.updateMany({ where: { id: { in: ids } }, data: { status: nextStatus } });
    updated = result.count;
  }

  logAudit(user.id, "ADMIN", body.approve ? "BULK_ACTIVATED" : "BULK_SUSPENDED", body.type ?? "Venue", ids.join(","), `${updated} item(s)`, "ADMIN");

  return NextResponse.json({ ok: true, updated });
});
