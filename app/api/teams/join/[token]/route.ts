import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { verifyTeamInvite } from "@/lib/team-invite";
import { serializeTeamDetail } from "@/lib/serializers";
import { notifyUser } from "@/lib/notify";

// GET /api/teams/join/:token -> preview the team an invite link points
// to. No auth required — someone should be able to see "you're about to
// join Thunder FC" before logging in / registering.
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { token: string } }) => {
  const payload = verifyTeamInvite(params.token);
  if (!payload) return jsonError("This invite link is invalid or has expired.", 410);

  const team = await prisma.team.findUnique({
    where: { id: payload.teamId },
    include: { members: { include: { user: true } } },
  });
  if (!team) return jsonError("Team not found", 404);

  return NextResponse.json({ team: serializeTeamDetail(team) });
});

// POST /api/teams/join/:token -> the logged-in user joins the team the
// invite points to, as a "Player" (same default role as a captain-added
// member — see app/api/teams/[id]/members/route.ts).
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { token: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Log in first to join this team.", 401);

  const payload = verifyTeamInvite(params.token);
  if (!payload) return jsonError("This invite link is invalid or has expired.", 410);

  const team = await prisma.team.findUnique({ where: { id: payload.teamId } });
  if (!team) return jsonError("Team not found", 404);

  const already = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: payload.teamId, userId: user.id } },
  });
  if (already) return jsonError("You're already on this team.", 409);

  await prisma.teamMember.create({
    data: { teamId: payload.teamId, userId: user.id, roleName: "Player" },
  });

  if (team.captainId !== user.id) {
    await notifyUser({
      userId: team.captainId,
      title: "New player joined via invite link",
      detail: `${user.name} joined ${team.name}`,
      type: "COMMUNITY",
    });
  }

  const updated = await prisma.team.findUnique({
    where: { id: payload.teamId },
    include: { members: { include: { user: true } } },
  });

  return NextResponse.json({ team: serializeTeamDetail(updated) });
});
