import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, verifyPassword } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// POST /api/auth/2fa/disable  { password }
// Requires re-entering the account password (not just being logged in)
// before turning 2FA off, since this is a security-downgrading action.
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return jsonError("Incorrect password.", 401);

  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null } });
  return NextResponse.json({ ok: true });
});
