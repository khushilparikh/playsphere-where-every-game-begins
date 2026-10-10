// Powers the "Continue as" (login page) and "Preview as" (topbar) role
// switcher. Logs into one of the four seeded demo accounts (see
// prisma/seed.ts) so reviewers can jump between roles without typing
// credentials, while still going through the real auth/session flow.
// This only works if you've opted into demo data — see README.md.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, authCookieOptions, AUTH_COOKIE } from "@/lib/auth";
import { ROLE_TO_DB, serializeUser, jsonError, withErrorHandling } from "@/lib/api-format";

const DEMO_EMAILS: Record<string, string> = {
  player: "player@playsphere.demo",
  organizer: "organizer@playsphere.demo",
  venue: "venue@playsphere.demo",
  trainer: "trainer@playsphere.demo",
};

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const role = body?.role as string;
  const email = DEMO_EMAILS[role];
  if (!email) return jsonError("Unknown demo role. Use player | organizer | venue | trainer.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return jsonError(
      "No demo account found. Register a real account instead, or run `npm run db:seed:demo` if you want sample data.",
      404
    );
  }

  const token = signToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
  const res = NextResponse.json({ user: serializeUser(user) });
  res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  return res;
});
