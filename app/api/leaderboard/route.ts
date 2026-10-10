import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, SPORT_TO_DB } from "@/lib/api-format";

// GET /api/leaderboard                  -> top 50 players by XP (global)
// GET /api/leaderboard?sport=Cricket     -> Task 43, Phase 6: top 50
// players by XP who list this sport in their sportsPref. This is a proxy
// for a true per-sport leaderboard (XP isn't tracked per-sport yet — it's
// one running total per user across every action they take, see
// lib/gamification.ts) rather than a real per-sport ranking; a genuine
// implementation would need a SportStat model tracking XP per (user,
// sport) pair, updated alongside every awardXp() call.
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");

  const users = await prisma.user.findMany({
    where: {
      role: "PLAYER",
      deletedAt: null,
      ...(sport && sport !== "All" ? { sportsPref: { has: (SPORT_TO_DB[sport] ?? sport) as any } } : {}),
    },
    orderBy: { xp: "desc" },
    take: 50,
    include: { badges: { include: { badge: true } } },
  });

  return NextResponse.json({
    leaderboard: users.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      area: u.area,
      xp: u.xp,
      level: u.sportsPassportLevel,
      matchesPlayed: u.matchesPlayed,
      tournamentsWon: u.tournamentsWon,
      badgeCount: u.badges.length,
    })),
  });
});
