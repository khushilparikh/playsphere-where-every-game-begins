// Task 44, Phase 6: closes out a leaderboard season — snapshots every
// player's current XP/rank/level into LeaderboardSnapshot (browsable
// afterward as "Hall of Fame" — see GET /api/leaderboard/hall-of-fame),
// then optionally resets XP for the new season.
//
// Deliberately a standalone script, not an in-app "close season" button —
// this is a rare, deliberate ops action that shouldn't be one misclick
// away in the admin console.
//
// Usage:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/snapshot-season.ts "2026-S1"
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/snapshot-season.ts "2026-S1" --reset

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const season = process.argv[2];
  const shouldReset = process.argv.includes("--reset");

  if (!season) {
    console.error('Usage: snapshot-season.ts "<season-label>" [--reset]');
    process.exit(1);
  }

  const players = await prisma.user.findMany({
    where: { role: "PLAYER", deletedAt: null },
    orderBy: { xp: "desc" },
    select: { id: true, xp: true, sportsPassportLevel: true },
  });

  console.log(`Snapshotting ${players.length} players for season "${season}"...`);

  await prisma.leaderboardSnapshot.createMany({
    data: players.map((p: (typeof players)[number], i: number) => ({
      season,
      userId: p.id,
      xp: p.xp,
      rank: i + 1,
      level: p.sportsPassportLevel,
    })),
  });

  if (shouldReset) {
    console.log("Resetting XP for the new season...");
    await prisma.user.updateMany({
      where: { role: "PLAYER", deletedAt: null },
      data: { xp: 0, sportsPassportLevel: "Bronze" },
    });
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
