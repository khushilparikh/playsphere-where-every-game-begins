import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { generateTotpSecret, totpKeyUri } from "@/lib/twofa";

// POST /api/auth/2fa/setup
// Admin-only (2FA is scoped to Admin accounts per the roadmap — elevated
// privilege, elevated protection). Generates a new secret and stores it
// as *pending* (totpEnabled stays false) — the frontend shows it as a QR
// code (see lib/twofa.ts#totpKeyUri) and the user must confirm a real
// code via POST /api/auth/2fa/verify before it actually protects login.
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Two-factor authentication is currently available for Admin accounts only.", 403);

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } });

  return NextResponse.json({ secret, otpauthUrl: totpKeyUri(user.email, secret) });
});
