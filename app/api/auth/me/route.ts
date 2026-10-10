import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, AUTH_COOKIE } from "@/lib/auth";
import { SPORT_TO_DB, serializeUser, jsonError, withErrorHandling } from "@/lib/api-format";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: serializeUser(user) });
});

// PATCH /api/auth/me  -> update the logged-in user's own profile details
export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => ({}));
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name?.trim() || undefined,
      phone: body.phone ?? undefined,
      area: body.area ?? undefined,
      organizationName: body.organizationName ?? undefined,
      sportsPref: Array.isArray(body.sportsPref)
        ? (body.sportsPref as string[]).map((s) => SPORT_TO_DB[s] ?? s) as any
        : undefined,
      avatar: body.avatar ?? undefined,
      banner: body.banner ?? undefined,
      bio: body.bio ?? undefined,
      skillRating: typeof body.skillRating === "number" ? body.skillRating : undefined,
      availability: body.availability ?? undefined,
      dominantHand: body.dominantHand ?? undefined,
      languages: Array.isArray(body.languages) ? body.languages : undefined,
      experienceLevel: body.experienceLevel ?? undefined,
      notifyEmail: typeof body.notifyEmail === "boolean" ? body.notifyEmail : undefined,
      notifyBooking: typeof body.notifyBooking === "boolean" ? body.notifyBooking : undefined,
      notifyTournament: typeof body.notifyTournament === "boolean" ? body.notifyTournament : undefined,
      notifyCommunity: typeof body.notifyCommunity === "boolean" ? body.notifyCommunity : undefined,
      profileVisibility: body.profileVisibility === "private" ? "private" : body.profileVisibility === "public" ? "public" : undefined,
    },
  });

  return NextResponse.json({ user: serializeUser(updated) });
});

// DELETE /api/auth/me  -> soft-delete the logged-in user's own account
// The row is kept (for referential integrity with teams/tournaments/posts
// they created) but flagged deletedAt, which immediately blocks login and
// any further API access.
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  await prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
