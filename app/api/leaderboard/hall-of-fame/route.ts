import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-format";

// GET /api/leaderboard/hall-of-fame              -> list of past seasons
// GET /api/leaderboard/hall-of-fame?season=2026-S1 -> that season's final standings
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get("season");

  if (season) {
    const rows = await prisma.leaderboardSnapshot.findMany({
      where: { season },
      include: { user: true },
      orderBy: { rank: "asc" },
      take: 50,
    });
    return NextResponse.json({
      season,
      standings: rows.map((r: (typeof rows)[number]) => ({
        rank: r.rank,
        userId: r.userId,
        name: r.user.name,
        avatar: r.user.avatar,
        xp: r.xp,
        level: r.level,
      })),
    });
  }

  const seasons = await prisma.leaderboardSnapshot.findMany({
    distinct: ["season"],
    select: { season: true, savedAt: true },
    orderBy: { savedAt: "desc" },
  });
  return NextResponse.json({ seasons: seasons.map((s: (typeof seasons)[number]) => s.season) });
});
