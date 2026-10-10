import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling, SPORT_FROM_DB, ROLE_FROM_DB } from "@/lib/api-format";

// GET /api/users/:id/public-profile
//
// Task 22, Phase 5: User.profileVisibility ("public"/"private", Module 1)
// already existed but nothing read it for a public-facing view until now.
// Returns a curated subset of fields — never email, phone, or anything
// account-management related — and only if the profile is public, or the
// viewer is the profile owner themselves or an admin.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const viewer = await getAuthUser(req);

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { badges: { include: { badge: true }, orderBy: { awardedAt: "desc" } } },
  });
  if (!user || user.deletedAt) return jsonError("User not found", 404);

  const isSelf = viewer?.id === user.id;
  const isAdmin = viewer?.role === "ADMIN";
  if (user.profileVisibility !== "public" && !isSelf && !isAdmin) {
    return jsonError("This profile is private.", 403);
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      name: user.name,
      role: ROLE_FROM_DB[user.role] ?? user.role,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      area: user.area,
      sportsPref: (user.sportsPref ?? []).map((s: string) => SPORT_FROM_DB[s] ?? s),
      skillRating: user.skillRating,
      experienceLevel: user.experienceLevel,
      dominantHand: user.dominantHand,
      languages: user.languages,
      sportsPassportLevel: user.sportsPassportLevel,
      xp: user.xp,
      matchesPlayed: user.matchesPlayed,
      tournamentsWon: user.tournamentsWon,
      memberSince: user.createdAt,
      badges: user.badges.map((ub: (typeof user.badges)[number]) => ({
        code: ub.badge.code,
        label: ub.badge.label,
        description: ub.badge.description,
        icon: ub.badge.icon,
        awardedAt: ub.awardedAt,
      })),
    },
  });
});
