import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling, serializeUser } from "@/lib/api-format";

// GET /api/auth/export -> a JSON dump of everything this account owns
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const [teams, tournaments, venues, bookings, posts, badges] = await Promise.all([
    prisma.team.findMany({ where: { captainId: user.id } }),
    prisma.tournament.findMany({ where: { organizerId: user.id } }),
    prisma.venue.findMany({ where: { ownerId: user.id } }),
    prisma.booking.findMany({ where: { userId: user.id } }),
    prisma.communityPost.findMany({ where: { authorId: user.id } }),
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: serializeUser(user),
    teamsCaptained: teams,
    tournamentsOrganized: tournaments,
    venuesOwned: venues,
    bookings,
    communityPosts: posts,
    badges: badges.map((b) => ({ code: b.badge.code, label: b.badge.label, awardedAt: b.awardedAt })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="playsphere-data-export.json"`,
    },
  });
});
