import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling, serializeUser, ROLE_TO_DB } from "@/lib/api-format";
import { logAudit } from "@/lib/audit";

const VALID_ROLES = Object.values(ROLE_TO_DB); // ["PLAYER","ORGANIZER","VENUE_OWNER","TRAINER","ADMIN"]

// PATCH /api/admin/users/:id  { status?: "ACTIVE" | "SUSPENDED", role?: "PLAYER" | "ORGANIZER" | "VENUE_OWNER" | "TRAINER" | "ADMIN" }
// Task 53, Phase 6: role change support added alongside the existing
// suspend/reactivate action. Never allows demoting the platform's last
// remaining admin (including yourself) — that would leave no one able to
// use the admin console to fix the mistake.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return jsonError("User not found", 404);

  const data: { status?: string; role?: string } = {};

  if (body.status !== undefined) {
    if (params.id === user.id) return jsonError("You can't suspend your own admin account", 400);
    if (!["ACTIVE", "SUSPENDED"].includes(body.status)) return jsonError("Invalid status");
    if (target.role === "ADMIN") return jsonError("Admins can't suspend other admins", 400);
    data.status = body.status;
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) return jsonError(`role must be one of: ${VALID_ROLES.join(", ")}`);
    if (target.role === "ADMIN" && body.role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN", deletedAt: null } });
      if (adminCount <= 1) return jsonError("Can't remove the last admin's admin role.", 400);
    }
    data.role = body.role;
  }

  if (Object.keys(data).length === 0) return jsonError("Nothing to update — pass status and/or role.");

  const updated = await prisma.user.update({ where: { id: params.id }, data: data as any });

  if (data.status) {
    logAudit(user.id, "ADMIN", data.status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED", "User", updated.id, updated.name, "ADMIN");
  }
  if (data.role) {
    logAudit(user.id, "ADMIN", "USER_ROLE_CHANGED", "User", updated.id, `${updated.name} → ${data.role}`, "ADMIN");
  }

  return NextResponse.json({ user: { ...serializeUser(updated), status: updated.status } });
});
