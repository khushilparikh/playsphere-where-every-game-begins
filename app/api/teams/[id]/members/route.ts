import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeTeamDetail } from "@/lib/serializers";
import { notifyUser } from "@/lib/notify";

// POST /api/teams/:id/members  { email }
// Team captain invites an existing registered player to the team by email.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) return jsonError("Team not found", 404);
  if (team.captainId !== user.id) return jsonError("Only the team captain can add members", 403);

  const body = await req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  if (!email) return jsonError("email is required");

  const player = await prisma.user.findUnique({ where: { email } });
  if (!player) return jsonError("No PlaySphere account found with that email. Ask them to register first.", 404);

  const already = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: params.id, userId: player.id } },
  });
  if (already) return jsonError("This player is already on the team.", 409);

  await prisma.teamMember.create({
    data: { teamId: params.id, userId: player.id, roleName: "Player" },
  });

  await notifyUser({
    userId: player.id,
    title: "Added to a team",
    detail: `You were added to ${team.name}`,
    type: "COMMUNITY",
  });

  const updated = await prisma.team.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } } },
  });

  return NextResponse.json({ team: serializeTeamDetail(updated) }, { status: 201 });
});
