import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-format";

// GET /api/search?q=...
// Task 50, Phase 6: a single lightweight endpoint the topbar search box
// hits, running small parallel queries across the main entities rather
// than a dedicated search index — fine at this data volume, and keeps
// this from needing a new infrastructure dependency (e.g. Elasticsearch).
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const contains = { contains: q, mode: "insensitive" as const };

  const [venues, tournaments, trainers, teams, players] = await Promise.all([
    prisma.venue.findMany({ where: { name: contains, status: "ACTIVE" }, take: 5, select: { id: true, name: true, area: true } }),
    prisma.tournament.findMany({ where: { name: contains }, take: 5, select: { id: true, name: true, sport: true } }),
    prisma.trainerProfile.findMany({
      where: { status: "ACTIVE", user: { name: contains } },
      take: 5,
      select: { id: true, sport: true, user: { select: { name: true } } },
    }),
    prisma.team.findMany({ where: { name: contains }, take: 5, select: { id: true, name: true, sport: true } }),
    prisma.user.findMany({
      where: { role: "PLAYER", deletedAt: null, name: contains, profileVisibility: "public" },
      take: 5,
      select: { id: true, name: true, area: true },
    }),
  ]);

  const results = [
    ...venues.map((v: (typeof venues)[number]) => ({ type: "Venue", id: v.id, label: v.name, sub: v.area, href: `/venues` })),
    ...tournaments.map((t: (typeof tournaments)[number]) => ({ type: "Tournament", id: t.id, label: t.name, sub: t.sport, href: `/tournaments` })),
    ...trainers.map((t: (typeof trainers)[number]) => ({ type: "Trainer", id: t.id, label: t.user.name, sub: t.sport, href: `/trainers` })),
    ...teams.map((t: (typeof teams)[number]) => ({ type: "Team", id: t.id, label: t.name, sub: t.sport, href: `/teams/${t.id}` })),
    ...players.map((p: (typeof players)[number]) => ({ type: "Player", id: p.id, label: p.name, sub: p.area, href: `/players/${p.id}` })),
  ];

  return NextResponse.json({ results });
});
