import { prisma } from "@/lib/prisma";

// XP thresholds -> the label already stored on User.sportsPassportLevel
export const LEVEL_THRESHOLDS: [number, string][] = [
  [0, "Bronze"],
  [150, "Silver"],
  [500, "Gold"],
  [1500, "Platinum"],
  [4000, "Diamond"],
];

// Task 10, Phase 3: badge code awarded the first time a user reaches each
// tier. Bronze has no badge — everyone starts there, so it wouldn't be a
// milestone. Declared here (rather than only in BADGE_CATALOG below) so
// awardXp() can look up "what badge, if any, goes with this level" by name.
const LEVEL_MILESTONE_BADGE: Record<string, string> = {
  Silver: "REACHED_SILVER",
  Gold: "REACHED_GOLD",
  Platinum: "REACHED_PLATINUM",
  Diamond: "REACHED_DIAMOND",
};

export function levelForXp(xp: number): string {
  let label = LEVEL_THRESHOLDS[0][1];
  for (const [threshold, name] of LEVEL_THRESHOLDS) {
    if (xp >= threshold) label = name;
  }
  return label;
}

/**
 * Add XP to a user and keep their Sports Passport level in sync. Call this
 * from any action worth rewarding (booking a venue, playing a match,
 * winning a tournament, posting for the first time, etc.) rather than
 * writing to `xp` directly, so the level label never drifts out of sync.
 *
 * When a level-up crosses into Silver/Gold/Platinum/Diamond, this also
 * awards the matching milestone badge (Task 10, Phase 3) via awardBadge()
 * — which itself calls back into awardXp() for the badge's bonus XP. That
 * bonus can, correctly, cascade into the *next* tier's badge too (finite
 * tiers, so this can't loop forever) rather than needing separate logic
 * to handle "leveled up two tiers in one action."
 */
export async function awardXp(userId: string, amount: number) {
  if (amount <= 0) return;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });
  const newLevel = levelForXp(user.xp);
  if (newLevel !== user.sportsPassportLevel) {
    await prisma.user.update({ where: { id: userId }, data: { sportsPassportLevel: newLevel } });
    const milestoneBadge = LEVEL_MILESTONE_BADGE[newLevel];
    if (milestoneBadge) await awardBadge(userId, milestoneBadge);
  }
  return user.xp;
}

// XP rewards for common actions — kept in one place so tuning them later
// doesn't mean hunting through every route.
export const XP_REWARDS = {
  POST_CREATED: 5,
  MATCH_PLAYED: 15,
  TOURNAMENT_WON: 150,
  TOURNAMENT_REGISTERED: 20,
  VENUE_BOOKED: 10,
  TEAM_CREATED: 10,
  BADGE_BONUS_MULTIPLIER: 1,
};

// Badge catalog — matched against on relevant actions. `code` must match
// prisma/seed-badges.ts / the Badge rows created via ensureBadgeCatalog().
export const BADGE_CATALOG: { code: string; label: string; description: string; icon: string; xpReward: number }[] = [
  { code: "FIRST_MATCH", label: "First Whistle", description: "Played your first match on PlaySphere", icon: "Flag", xpReward: 20 },
  { code: "TEN_MATCHES", label: "Regular Player", description: "Played 10 matches", icon: "Flame", xpReward: 50 },
  { code: "TOURNAMENT_WINNER", label: "Champion", description: "Won a tournament", icon: "Trophy", xpReward: 100 },
  { code: "FIRST_TEAM", label: "Team Builder", description: "Created your first team", icon: "Users", xpReward: 15 },
  { code: "FIRST_BOOKING", label: "Court Regular", description: "Booked your first venue", icon: "MapPin", xpReward: 15 },
  { code: "FIRST_POST", label: "Community Voice", description: "Made your first community post", icon: "MessageSquare", xpReward: 10 },
  { code: "TOURNAMENT_HOST", label: "Organizer", description: "Created your first tournament", icon: "Trophy", xpReward: 25 },
  // Task 10, Phase 3: level milestone badges, awarded from awardXp() —
  // see LEVEL_MILESTONE_BADGE above.
  { code: "REACHED_SILVER", label: "Silver Tier", description: "Reached Silver on the Sports Passport", icon: "Award", xpReward: 10 },
  { code: "REACHED_GOLD", label: "Gold Tier", description: "Reached Gold on the Sports Passport", icon: "Award", xpReward: 25 },
  { code: "REACHED_PLATINUM", label: "Platinum Tier", description: "Reached Platinum on the Sports Passport", icon: "Award", xpReward: 50 },
  { code: "REACHED_DIAMOND", label: "Diamond Tier", description: "Reached Diamond on the Sports Passport", icon: "Award", xpReward: 100 },
];

/** Ensures the Badge catalog rows exist in the DB (idempotent, safe to call often). */
export async function ensureBadgeCatalog() {
  for (const b of BADGE_CATALOG) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: {},
      create: b,
    });
  }
}

/** Awards a badge to a user if they don't already have it, and grants its XP once. */
export async function awardBadge(userId: string, code: string) {
  let badge = await prisma.badge.findUnique({ where: { code } });
  if (!badge) {
    // Self-heal: create this badge from the catalog on first use, so
    // badges work correctly even if ensureBadgeCatalog() was never run.
    const def = BADGE_CATALOG.find((b) => b.code === code);
    if (!def) return; // unknown code — nothing to award
    badge = await prisma.badge.upsert({ where: { code }, update: {}, create: def });
  }
  const already = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (already) return;
  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  await awardXp(userId, badge.xpReward);
}
