export type Role = "player" | "organizer" | "venue" | "trainer" | "admin";

export const roleMeta: Record<Role, { label: string; short: string }> = {
  player: { label: "Player", short: "Player" },
  organizer: { label: "Tournament Organizer", short: "Organizer" },
  venue: { label: "Venue Owner", short: "Venue Owner" },
  trainer: { label: "Trainer / Academy", short: "Trainer" },
  admin: { label: "Administrator", short: "Admin" },
};

export const ROLE_STORAGE_KEY = "playsphere:role";

// The frontend uses short lowercase role ids (above) for readability in
// the UI layer. The database (prisma/schema.prisma) uses the enum names
// PLAYER | ORGANIZER | VENUE_OWNER | TRAINER | ADMIN. These two maps are
// the single source of truth for converting between them — used by the
// API routes (server-side) and by any client code that talks to the API.
// Deliberately plain strings here (no `@prisma/client` import) so this
// file stays safe to import from "use client" components.

export const ROLE_TO_DB: Record<Role, string> = {
  player: "PLAYER",
  organizer: "ORGANIZER",
  venue: "VENUE_OWNER",
  trainer: "TRAINER",
  admin: "ADMIN",
};

export const ROLE_FROM_DB: Record<string, Role> = {
  PLAYER: "player",
  ORGANIZER: "organizer",
  VENUE_OWNER: "venue",
  TRAINER: "trainer",
  ADMIN: "admin",
};
