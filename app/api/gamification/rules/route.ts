import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api-format";
import { LEVEL_THRESHOLDS, XP_REWARDS } from "@/lib/gamification";

// GET /api/gamification/rules -> the same thresholds/rewards awardXp()
// actually uses, so the leaderboard page can show real numbers instead of
// a separately-maintained (and easily stale) description of them.
const ACTION_LABELS: Record<keyof typeof XP_REWARDS, string> = {
  POST_CREATED: "Publish a community post",
  MATCH_PLAYED: "Play a match",
  TOURNAMENT_WON: "Win a tournament",
  TOURNAMENT_REGISTERED: "Register a team for a tournament",
  VENUE_BOOKED: "Book a venue",
  TEAM_CREATED: "Create a team",
  BADGE_BONUS_MULTIPLIER: "Badge bonus multiplier",
};

export const GET = withErrorHandling(async () => {
  const levels = LEVEL_THRESHOLDS.map(([xp, label]) => ({ xp, label }));
  const actions = Object.entries(XP_REWARDS)
    .filter(([key]) => key !== "BADGE_BONUS_MULTIPLIER") // not a per-action reward, skip in the list
    .map(([key, xp]) => ({ label: ACTION_LABELS[key as keyof typeof XP_REWARDS], xp }));

  return NextResponse.json({ levels, actions });
});
