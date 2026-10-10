import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// PATCH /api/notifications/:id  { read: true }
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const notif = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notif || notif.userId !== user.id) return jsonError("Not found", 404);

  const body = await req.json().catch(() => ({}));
  await prisma.notification.update({ where: { id: params.id }, data: { read: body.read ?? true } });
  return NextResponse.json({ ok: true });
});
