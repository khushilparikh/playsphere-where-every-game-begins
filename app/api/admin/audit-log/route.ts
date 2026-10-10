import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import * as xlsx from "xlsx";
import { Prisma } from "@prisma/client";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const role = searchParams.get("role");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const q = searchParams.get("q");
  const format = searchParams.get("format") || "json";

  // Build WHERE conditions as raw SQL fragments
  const conditions: Prisma.Sql[] = [];
  if (category && category !== "All") conditions.push(Prisma.sql`a.category = ${category}`);
  if (role && role !== "All") conditions.push(Prisma.sql`a."actorRole" = ${role}`);
  if (startDate) conditions.push(Prisma.sql`a."createdAt" >= ${new Date(startDate)}`);
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    conditions.push(Prisma.sql`a."createdAt" <= ${end}`);
  }
  if (q) {
    conditions.push(Prisma.sql`(
      a.action ILIKE ${"%" + q + "%"} OR
      a.detail ILIKE ${"%" + q + "%"} OR
      u.name ILIKE ${"%" + q + "%"}
    )`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;

  const limitClause = format === "json" ? Prisma.sql`LIMIT 200` : Prisma.empty;

  const logs: any[] = await prisma.$queryRaw`
    SELECT
      a.id,
      a."createdAt" as timestamp,
      COALESCE(u.name, 'System') as actor,
      COALESCE(a."actorRole", '-') as role,
      COALESCE(a.category, 'ADMIN') as category,
      a.action,
      a."targetType",
      a."targetId",
      COALESCE(a.detail, '') as detail
    FROM "AuditLog" a
    LEFT JOIN "User" u ON u.id = a."actorId"
    ${whereClause}
    ORDER BY a."createdAt" DESC
    ${limitClause}
  `;

  const rows = logs.map((l: any) => ({
    id: l.id,
    timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
    actor: l.actor,
    role: l.role,
    category: l.category,
    action: l.action,
    targetType: l.targettype ?? l.targetType,
    targetId: l.targetid ?? l.targetId,
    detail: l.detail,
  }));

  if (format === "csv" || format === "xlsx") {
    const header = ["Timestamp", "Actor Name", "Actor Role", "Category", "Action", "Target Type", "Target ID", "Details"];
    const exportRows = rows.map((r) => [
      r.timestamp,
      r.actor,
      r.role,
      r.category,
      r.action,
      r.targetType,
      r.targetId,
      r.detail,
    ]);

    if (format === "csv") {
      const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csvLines = [header.join(","), ...exportRows.map((r) => r.map(escape).join(","))];
      return new NextResponse(csvLines.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="playsphere-audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (format === "xlsx") {
      const worksheet = xlsx.utils.aoa_to_sheet([header, ...exportRows]);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
      const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="playsphere-audit-log-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }
  }

  return NextResponse.json({ logs: rows });
});


