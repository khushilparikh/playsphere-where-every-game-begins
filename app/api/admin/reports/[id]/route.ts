import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { logAudit } from "@/lib/audit";

const AUTO_HIDE_THRESHOLD = 3;

// PATCH /api/admin/reports/:id  { action: "dismiss" | "remove" }
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return jsonError("Not found", 404);

  if (body.action === "remove") {
    await prisma.communityPost.delete({ where: { id: report.postId } }).catch(() => {});
    await prisma.report.update({ where: { id: params.id }, data: { status: "REMOVED" } });
    logAudit(user.id, "ADMIN", "REPORT_POST_REMOVED", "Report", report.id, report.reason, "ADMIN");
  } else {
    await prisma.report.update({ where: { id: params.id }, data: { status: "DISMISSED" } });
    logAudit(user.id, "ADMIN", "REPORT_DISMISSED", "Report", report.id, report.reason, "ADMIN");

    // Task 34, Phase 6: if dismissing this report drops the post's open
    // report count back under the auto-hide threshold, restore it to the
    // public feed rather than leaving it hidden with no open reports left.
    const remainingOpen = await prisma.report.count({ where: { postId: report.postId, status: "OPEN" } });
    if (remainingOpen < AUTO_HIDE_THRESHOLD) {
      await prisma.communityPost.update({ where: { id: report.postId }, data: { hidden: false } }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
});
