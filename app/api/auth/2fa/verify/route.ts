import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { verifyTotpCode } from "@/lib/twofa";

// POST /api/auth/2fa/verify  { code }
// Confirms the code from the authenticator app matches the pending
// secret from /setup, and flips totpEnabled on — from this point, login
// requires a code (see app/api/auth/login/route.ts).
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (!user.totpSecret) return jsonError("Run 2FA setup first.", 400);

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!verifyTotpCode(code, user.totpSecret)) return jsonError("Incorrect code. Please try again.", 400);

  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  return NextResponse.json({ ok: true });
});
