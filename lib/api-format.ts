// Converts between Prisma's SCREAMING_SNAKE_CASE enums and the friendly
// string literals the frontend components/mock-data were already written
// against — this lets API responses drop straight into existing components
// with zero prop-shape changes.

export const SPORT_TO_DB: Record<string, string> = {
  Cricket: "CRICKET",
  Football: "FOOTBALL",
  Badminton: "BADMINTON",
  Basketball: "BASKETBALL",
  Tennis: "TENNIS",
  "Table Tennis": "TABLE_TENNIS",
  Volleyball: "VOLLEYBALL",
};
export const SPORT_FROM_DB: Record<string, string> = Object.fromEntries(
  Object.entries(SPORT_TO_DB).map(([k, v]) => [v, k])
);

export const ROLE_TO_DB: Record<string, string> = {
  player: "PLAYER",
  organizer: "ORGANIZER",
  venue: "VENUE_OWNER",
  trainer: "TRAINER",
  admin: "ADMIN",
};
export const ROLE_FROM_DB: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_TO_DB).map(([k, v]) => [v, k])
);

export const VENUE_STATUS_FROM_DB: Record<string, string> = {
  ACTIVE: "Active",
  UNDER_REVIEW: "Under review",
};
export const VENUE_STATUS_TO_DB: Record<string, string> = {
  Active: "ACTIVE",
  "Under review": "UNDER_REVIEW",
};

export const TOURNAMENT_STATUS_FROM_DB: Record<string, string> = {
  REGISTRATION_OPEN: "Registration Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};
export const TOURNAMENT_STATUS_TO_DB: Record<string, string> = {
  "Registration Open": "REGISTRATION_OPEN",
  "In Progress": "IN_PROGRESS",
  Completed: "COMPLETED",
};

export const LEVEL_FROM_DB: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};
export const LEVEL_TO_DB: Record<string, string> = {
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
};

export const NOTIF_TYPE_FROM_DB: Record<string, string> = {
  BOOKING: "booking",
  TOURNAMENT: "tournament",
  COMMUNITY: "community",
  SYSTEM: "system",
};

export function sportsFromDb(arr: string[]) {
  return arr.map((s) => SPORT_FROM_DB[s] ?? s);
}
export function sportsToDb(arr: string[]) {
  return arr.map((s) => SPORT_TO_DB[s] ?? s);
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Wraps an API route handler so that any unexpected thrown error (Prisma
 * constraint violations, bad JSON, etc.) is returned as a proper JSON error
 * response instead of Next's default HTML error page — which is what was
 * causing the generic "Request failed (500)" alert on the frontend.
 */
/**
 * Wraps an API route handler so that any unexpected thrown error (Prisma
 * constraint violations, bad JSON, etc.) is returned as a proper JSON error
 * response instead of Next's default HTML error page — which is what was
 * causing the generic "Request failed (500)" alert on the frontend.
 *
 * Also logs a structured, one-line-per-field record to stderr on failure
 * (timestamp, method, path, error message, and stack) so failures are
 * greppable in server logs instead of a bare `console.error(err)` dump.
 * Deliberately dependency-free — no external logging service — see
 * PlaySphere-Improvement-Roadmap.md's scope note. Swap the body of
 * `logApiError` for a real logger (pino, Sentry, etc.) later without
 * touching any call site, since every route already goes through here.
 */
function logApiError(err: any, args: unknown[]) {
  const req = args[0] as { method?: string; url?: string } | undefined;
  let path = "unknown";
  if (req?.url) {
    try {
      path = new URL(req.url).pathname;
    } catch {
      path = req.url;
    }
  }
  const record = {
    level: "error",
    time: new Date().toISOString(),
    method: req?.method ?? "unknown",
    path,
    message: err?.message || String(err),
    code: err?.code,
    stack: err?.stack,
  };
  console.error(JSON.stringify(record));
}

export function withErrorHandling<A extends any[]>(
  handler: (...args: A) => Promise<Response>
) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (err: any) {
      logApiError(err, args);
      if (err?.code === "P2002") {
        return jsonError("That record already exists.", 409);
      }
      if (err?.code === "P2025") {
        return jsonError("Record not found.", 404);
      }
      return jsonError(err?.message || "Something went wrong. Please try again.", 500);
    }
  };
}

export const ROLE_LABELS: Record<string, string> = {
  PLAYER: "Player",
  ORGANIZER: "Tournament Organizer",
  VENUE_OWNER: "Venue Owner",
  TRAINER: "Trainer / Academy",
  ADMIN: "Administrator",
};

export function serializeUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    area: u.area,
    role: ROLE_FROM_DB[u.role] ?? String(u.role).toLowerCase(),
    roleLabel: ROLE_LABELS[u.role] ?? u.role,
    organizationName: u.organizationName ?? null,
    sportsPref: sportsFromDb(u.sportsPref || []),
    memberSince: String(new Date(u.createdAt).getFullYear()),
    matchesPlayed: u.matchesPlayed,
    tournamentsWon: u.tournamentsWon,
    sportsPassportLevel: u.sportsPassportLevel,
    avatar: u.avatar ?? null,
    banner: u.banner ?? null,
    bio: u.bio ?? null,
    skillRating: u.skillRating ?? 0,
    availability: u.availability ?? null,
    dominantHand: u.dominantHand ?? null,
    languages: u.languages ?? [],
    experienceLevel: u.experienceLevel ?? null,
    xp: u.xp ?? 0,
    notifyEmail: u.notifyEmail ?? true,
    notifyBooking: u.notifyBooking ?? true,
    notifyTournament: u.notifyTournament ?? true,
    notifyCommunity: u.notifyCommunity ?? true,
    profileVisibility: u.profileVisibility ?? "public",
    followedTags: u.followedTags ?? [],
    totpEnabled: u.totpEnabled ?? false, // Task 47, Phase 6 — never expose totpSecret itself
  };
}
