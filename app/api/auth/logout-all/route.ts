import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, AUTH_COOKIE } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// POST /api/auth/logout-all
// Task 45, Phase 6: invalidates every JWT issued to this user (this
// device included) by bumping tokenVersion — see getAuthUser in
// lib/auth.ts, which rejects any token whose tokenVersion doesn't match
// the user's current one. Also clears this device's cookie directly so
// the "log out everywhere" click ends this session immediately rather
// than waiting for the next request to bounce off the version check.
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { tokenVersion: { increment: 1 } },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
