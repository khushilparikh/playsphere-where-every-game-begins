import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, TOURNAMENT_STATUS_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeTournament } from "@/lib/serializers";
import { awardBadge } from "@/lib/gamification";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// GET /api/tournaments               -> public browse list (?sport=&status=)
// GET /api/tournaments?mine=true     -> tournaments run by the logged-in Organizer
export const GET = withErrorHandling(async (req: NextRequest) => {
  if (!checkRateLimit(`tournaments-get:${clientIp(req)}`, 60, 60 * 1000)) {
    return jsonError("Too many requests. Please slow down and try again shortly.", 429);
  }

  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const status = searchParams.get("status");
  const mine = searchParams.get("mine");

  const where: any = {};
  if (mine === "true") {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);
    where.organizerId = user.id;
  } else {
    where.isPublic = true;
  }
  if (sport && sport !== "All") where.sport = SPORT_TO_DB[sport] ?? sport;
  if (status && status !== "All") where.status = TOURNAMENT_STATUS_TO_DB[status] ?? status;

  const tournaments = await prisma.tournament.findMany({
    where,
    include: { organizer: true, registrations: true, _count: { select: { registrations: true } } },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ tournaments: tournaments.map(serializeTournament) });
});

// POST /api/tournaments  -> Organizer creates a new tournament
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    return jsonError("Only tournament organizers can create tournaments", 403);
  }

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.sport || !body?.startDate) {
    return jsonError("name, sport and startDate are required");
  }

  const tournament = await prisma.tournament.create({
    data: {
      organizerId: user.id,
      name: body.name,
      sport: (SPORT_TO_DB[body.sport] ?? body.sport) as any,
      format: body.format || "Knockout",
      bracketType: body.bracketType === "LEAGUE" ? "LEAGUE" : "KNOCKOUT",
      isPublic: body.isPublic ?? true,
      teamsCap: body.teamsCap ?? 16,
      entryFee: body.entryFee ?? 0,
      startDate: new Date(body.startDate),
      status: "REGISTRATION_OPEN",
    },
    include: { organizer: true, registrations: true },
  });

  await awardBadge(user.id, "TOURNAMENT_HOST");

  logAudit(user.id, "TOURNAMENT", "TOURNAMENT_HOSTED", "Tournament", tournament.id, tournament.name, user.role);

  return NextResponse.json({ tournament: serializeTournament(tournament) }, { status: 201 });
});
