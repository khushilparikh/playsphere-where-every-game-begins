import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeRegistration } from "@/lib/serializers";
import { awardXp, XP_REWARDS } from "@/lib/gamification";
import { validate } from "@/lib/validation/validate";
import { registerTeamSchema } from "@/lib/validation/tournament-registration";
import { notifyUser } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

// POST /api/tournaments/:id/register  { teamId, players? }
// A team captain registers their team for this tournament. `players`
// defaults to the team's actual roster size (works for solo/singles sports
// too, where a team may have just one member) rather than always assuming
// an 11-a-side squad.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return jsonError("Invalid JSON body");

  // Task 7, Phase 2: schema-validated — see lib/validation/tournament-registration.ts
  const parsed = validate(registerTeamSchema, rawBody);
  if (parsed instanceof Response) return parsed;
  const body = parsed;

  const [tournament, team] = await Promise.all([
    prisma.tournament.findUnique({ 
      where: { id: params.id }, 
      include: { 
        registrations: {
          include: { payment: true }
        }
      } 
    }),
    prisma.team.findUnique({ where: { id: body.teamId }, include: { _count: { select: { members: true } } } }),
  ]);
  if (!tournament) return jsonError("Tournament not found", 404);
  if (!team) return jsonError("Team not found", 404);
  if (team.captainId !== user.id) return jsonError("Only the team captain can register this team", 403);
  if (tournament.status !== "REGISTRATION_OPEN") return jsonError("Registration is closed for this tournament", 409);

  // Count active registrations: APPROVED, or PENDING with active payment lock or paid successfully
  const activeRegistrations = tournament.registrations.filter((r: any) => {
    if (r.status === "APPROVED") return true;
    if (r.status === "PENDING") {
      if (r.paymentStatus === "SUCCESS") return true;
      if (r.payment && new Date(r.payment.expiresAt).getTime() > Date.now()) return true;
      if (!r.payment) {
        // 60-second grace period for in-flight payment initiations
        const ageMs = Date.now() - new Date(r.createdAt).getTime();
        return ageMs < 60000;
      }
    }
    return false;
  }).length;

  if (activeRegistrations >= tournament.teamsCap) return jsonError("Tournament is full", 409);

  const existing = await prisma.teamRegistration.findUnique({
    where: { tournamentId_teamId: { tournamentId: params.id, teamId: body.teamId } },
  });
  if (existing) return jsonError("This team is already registered for this tournament.", 409);

  const registration = await prisma.teamRegistration.create({
    data: {
      tournamentId: params.id,
      teamId: body.teamId,
      players: body.players ?? Math.max(team._count.members, 1),
      status: "PENDING",
    },
    include: { team: true, tournament: true },
  });

  await notifyUser({
    userId: tournament.organizerId,
    title: "New team registration",
    detail: `${team.name} registered for ${tournament.name}`,
    type: "TOURNAMENT",
  });

  await awardXp(user.id, XP_REWARDS.TOURNAMENT_REGISTERED);

  logAudit(user.id, "TOURNAMENT", "TEAM_REGISTERED", "Tournament", tournament.id, `${team.name} registered`, user.role);

  return NextResponse.json({ registration: serializeRegistration(registration) }, { status: 201 });
});
