import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, authCookieOptions, AUTH_COOKIE } from "@/lib/auth";
import { serializeUser, jsonError, withErrorHandling } from "@/lib/api-format";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/notify";
import { verifyTotpCode } from "@/lib/twofa";
import { logAudit } from "@/lib/audit";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) return jsonError("email and password are required");

  const ip = clientIp(req);
  if (!checkRateLimit(`login:${ip}:${body.email}`, 8, 5 * 60 * 1000)) {
    return jsonError("Too many login attempts. Please wait a few minutes and try again.", 429);
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) return jsonError("Invalid email or password", 401);

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    await prisma.loginEvent.create({
      data: { userId: user.id, success: false, ip, userAgent: req.headers.get("user-agent") ?? undefined },
    });
    return jsonError("Invalid email or password", 401);
  }

  if (user.status === "SUSPENDED") {
    return jsonError("Your account has been suspended. Contact an admin for help.", 403);
  }
  if (user.deletedAt) {
    return jsonError("This account has been deleted.", 403);
  }

  // Task 47, Phase 6: if this account has 2FA enabled, the password
  // alone isn't enough — require a valid TOTP code too. Returning a
  // distinct `requires2FA: true` (rather than a generic error) lets the
  // login form show a second "enter your code" step instead of just
  // failing, without ever having issued a session cookie yet.
  if (user.totpEnabled) {
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!code) {
      return NextResponse.json({ requires2FA: true }, { status: 401 });
    }
    if (!user.totpSecret || !verifyTotpCode(code, user.totpSecret)) {
      return jsonError("Incorrect authentication code.", 401);
    }
  }

  // Lightweight suspicious-login detection: if this IP has never
  // succeeded before for this account, let the user know via a
  // notification (their existing notification preferences apply).
  if (ip !== "unknown" && user.notifyEmail) {
    const seenBefore = await prisma.loginEvent.findFirst({
      where: { userId: user.id, ip, success: true },
    });
    if (!seenBefore) {
      await notifyUser({
        userId: user.id,
        title: "New sign-in detected",
        detail: `Your account was just signed in to from a new location (${ip}). If this wasn't you, contact an admin.`,
        type: "SYSTEM",
      });
    }
  }

  await prisma.loginEvent.create({
    data: { userId: user.id, success: true, ip, userAgent: req.headers.get("user-agent") ?? undefined },
  });

  logAudit(user.id, "SECURITY", "USER_LOGIN_SUCCESS", "User", user.id, `IP: ${ip}`, user.role);

  const token = signToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
  const res = NextResponse.json({ user: serializeUser(user) });
  res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  return res;
});
