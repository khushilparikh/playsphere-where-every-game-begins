import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeTeamDetail } from "@/lib/serializers";

// Task 8, Phase 3: team roles beyond "Captain"/default "Player". This is
// intentionally a free-text role name (e.g. "Vice-Captain", "Coach"),
// matching TeamMember.roleName's existing shape — no schema change
// needed, just the missing API + UI to set it.
const MAX_ROLE_LENGTH = 30;

// PATCH /api/teams/:id/members/:memberId  { roleName }
// Only the team captain can reassign a member's role. The captain's own
// membership row keeps roleName "Captain" — renaming it here would be
// confusing since Team.captainId is the actual source of truth for who
// captains the team.
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string; memberId: string } }) => {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);

    const team = await prisma.team.findUnique({ where: { id: params.id } });
    if (!team) return jsonError("Team not found", 404);
    if (team.captainId !== user.id) return jsonError("Only the team captain can change roles", 403);

    const member = await prisma.teamMember.findUnique({ where: { id: params.memberId } });
    if (!member || member.teamId !== params.id) return jsonError("Team member not found", 404);
    if (member.userId === team.captainId) {
      return jsonError("The captain's role is set by team ownership, not editable here", 400);
    }

    const body = await req.json().catch(() => null);
    const roleName = typeof body?.roleName === "string" ? body.roleName.trim() : "";
    if (!roleName) return jsonError("roleName is required");
    if (roleName.length > MAX_ROLE_LENGTH) return jsonError(`roleName must be ${MAX_ROLE_LENGTH} characters or fewer`);
    if (roleName.toLowerCase() === "captain") {
      return jsonError("Use team transfer (not supported yet) to change who captains the team");
    }

    await prisma.teamMember.update({ where: { id: params.memberId }, data: { roleName } });

    const updated = await prisma.team.findUnique({
      where: { id: params.id },
      include: { members: { include: { user: true } } },
    });

    return NextResponse.json({ team: serializeTeamDetail(updated) });
  }
);

// DELETE /api/teams/:id/members/:memberId  -> captain removes a player from the roster
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string; memberId: string } }) => {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);

    const team = await prisma.team.findUnique({ where: { id: params.id } });
    if (!team) return jsonError("Team not found", 404);
    if (team.captainId !== user.id) return jsonError("Only the team captain can remove members", 403);

    const member = await prisma.teamMember.findUnique({ where: { id: params.memberId } });
    if (!member || member.teamId !== params.id) return jsonError("Team member not found", 404);
    if (member.userId === team.captainId) return jsonError("The captain can't be removed from their own team", 400);

    await prisma.teamMember.delete({ where: { id: params.memberId } });

    const updated = await prisma.team.findUnique({
      where: { id: params.id },
      include: { members: { include: { user: true } } },
    });

    return NextResponse.json({ team: serializeTeamDetail(updated) });
  }
);
