import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeTeamDetail } from "@/lib/serializers";

// GET /api/teams/:id -> full roster for the Roster modal
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } } },
  });
  if (!team) return jsonError("Team not found", 404);

  const isMember = team.captainId === user.id || team.members.some((m) => m.userId === user.id);
  if (!isMember && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  return NextResponse.json({ team: serializeTeamDetail(team) });
});

// PATCH /api/teams/:id  { logo?, coachName?, coachContact? } -> captain updates team profile
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) return jsonError("Team not found", 404);
  if (team.captainId !== user.id) return jsonError("Only the team captain can edit team details", 403);

  const body = await req.json().catch(() => ({}));
  const updated = await prisma.team.update({
    where: { id: params.id },
    data: {
      logo: body.logo ?? undefined,
      logoColor: body.logoColor ?? undefined,
      coachName: body.coachName ?? undefined,
      coachContact: body.coachContact ?? undefined,
    },
    include: { members: { include: { user: true } } },
  });

  return NextResponse.json({ team: serializeTeamDetail(updated) });
});
