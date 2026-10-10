// Maps the frontend's display-friendly sport names (used throughout
// lib/mock-data.ts and every page) to the Prisma `Sport` enum values
// (prisma/schema.prisma), and back. Plain strings only — safe to import
// from "use client" components as well as server-side API routes.

export const SPORT_TO_DB: Record<string, string> = {
  Cricket: "CRICKET",
  Football: "FOOTBALL",
  Badminton: "BADMINTON",
  Basketball: "BASKETBALL",
  Tennis: "TENNIS",
  "Table Tennis": "TABLE_TENNIS",
  Volleyball: "VOLLEYBALL",
};

export const SPORT_FROM_DB: Record<string, string> = {
  CRICKET: "Cricket",
  FOOTBALL: "Football",
  BADMINTON: "Badminton",
  BASKETBALL: "Basketball",
  TENNIS: "Tennis",
  TABLE_TENNIS: "Table Tennis",
  VOLLEYBALL: "Volleyball",
};

export function sportToDb(sport: string): string {
  const mapped = SPORT_TO_DB[sport];
  if (!mapped) throw new Error(`Unknown sport: "${sport}"`);
  return mapped;
}

export function sportFromDb(sport: string): string {
  return SPORT_FROM_DB[sport] ?? sport;
}
