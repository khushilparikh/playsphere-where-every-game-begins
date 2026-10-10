import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { logAudit } from "@/lib/audit";

// GET /api/admin/reports  -> open community-post reports (ADMIN only)
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: { post: { include: { author: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      postId: r.postId,
      author: r.post.author.name,
      reason: r.reason,
      time: r.createdAt,
    })),
  });
});

// POST /api/admin/reports  { postId, reason }  -> any user reports a post
const AUTO_HIDE_THRESHOLD = 3;

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.postId || !body?.reason) return jsonError("postId and reason are required");

  const report = await prisma.report.create({ data: { postId: body.postId, reason: body.reason } });

  // Task 34, Phase 6: once a post crosses AUTO_HIDE_THRESHOLD open
  // reports, hide it from the public feed pending admin review, instead
  // of leaving a heavily-reported post visible indefinitely. The post
  // stays visible to its author and to admins (see GET /api/posts and
  // the admin reports queue) — this only affects other users' feeds.
  const openReportCount = await prisma.report.count({ where: { postId: body.postId, status: "OPEN" } });
  if (openReportCount >= AUTO_HIDE_THRESHOLD) {
    await prisma.communityPost.update({ where: { id: body.postId }, data: { hidden: true } });
  }

  return NextResponse.json({ report }, { status: 201 });
});

// PATCH /api/admin/reports  { ids: string[] }  -> bulk-dismiss reports
// Task 51, Phase 6: batch dismiss, alongside the existing per-report
// dismiss/remove at PATCH /api/admin/reports/:id. Bulk "remove" isn't
// offered here since deleting several different posts at once is
// higher-consequence than dismissing reports — that stays a deliberate
// one-at-a-time action.
export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return jsonError("ids array is required");
  if (ids.length > 100) return jsonError("Can't bulk-update more than 100 items at once");

  const reports = await prisma.report.findMany({ where: { id: { in: ids } } });
  await prisma.report.updateMany({ where: { id: { in: ids } }, data: { status: "DISMISSED" } });

  // Same auto-hide-threshold reconciliation as the single-report dismiss
  // route — restore any post whose open-report count drops back under
  // the threshold as a result of this bulk dismissal.
  const postIds = Array.from(new Set(reports.map((r) => r.postId)));
  for (const postId of postIds) {
    const remainingOpen = await prisma.report.count({ where: { postId, status: "OPEN" } });
    if (remainingOpen < AUTO_HIDE_THRESHOLD) {
      await prisma.communityPost.update({ where: { id: postId }, data: { hidden: false } }).catch(() => {});
    }
  }

  logAudit(user.id, "ADMIN", "BULK_REPORTS_DISMISSED", "Report", ids.join(","), `${ids.length} report(s)`, "ADMIN");

  return NextResponse.json({ ok: true, updated: ids.length });
});
