import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { signTeamInvite } from "@/lib/team-invite";

// POST /api/teams/:id/invite -> captain-only, returns a fresh 7-day
// invite token. The frontend turns this into a full URL
// (`${origin}/teams/join/${token}`) and renders it as both a copyable
// link and a QR code (see RosterModal in app/(dashboard)/teams/page.tsx).
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) return jsonError("Team not found", 404);
  if (team.captainId !== user.id) return jsonError("Only the team captain can create an invite link", 403);

  const token = signTeamInvite(params.id);
  return NextResponse.json({ token });
});
