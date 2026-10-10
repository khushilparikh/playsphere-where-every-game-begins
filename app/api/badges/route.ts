import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/badges            -> the logged-in user's own badges
// GET /api/badges?userId=... -> another user's badges (public)
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  let userId = searchParams.get("userId");

  if (!userId) {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);
    userId = user.id;
  }

  const badges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { awardedAt: "desc" },
  });

  return NextResponse.json({
    badges: badges.map((b) => ({
      code: b.badge.code,
      label: b.badge.label,
      description: b.badge.description,
      icon: b.badge.icon,
      awardedAt: b.awardedAt,
    })),
  });
});
