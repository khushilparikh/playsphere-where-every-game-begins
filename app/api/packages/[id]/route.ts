import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// PATCH /api/packages/:id { active }
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const pkg = await prisma.trainerPackage.findUnique({ where: { id: params.id }, include: { trainer: true } });
  if (!pkg) return jsonError("Package not found", 404);
  if (pkg.trainer.userId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const updated = await prisma.trainerPackage.update({
    where: { id: params.id },
    data: { active: typeof body.active === "boolean" ? body.active : undefined },
  });

  return NextResponse.json({ package: updated });
});
