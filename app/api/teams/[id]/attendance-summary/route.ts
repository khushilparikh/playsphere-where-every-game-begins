import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/teams/:id/attendance-summary
// Task 33, Phase 6: per-player attendance % across all of this team's
// PracticeSessions — team members only (same visibility as the roster).
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } } },
  });
  if (!team) return jsonError("Team not found", 404);
  const isMember = team.captainId === user.id || team.members.some((m: (typeof team.members)[number]) => m.userId === user.id);
  if (!isMember) return jsonError("Forbidden", 403);

  const sessions = await prisma.practiceSession.findMany({
    where: { teamId: params.id },
    include: { attendance: true },
  });
  const totalSessions = sessions.length;

  const summary = team.members.map((m: (typeof team.members)[number]) => {
    const attended = sessions.filter((s: (typeof sessions)[number]) =>
      s.attendance.some((a: (typeof s.attendance)[number]) => a.userId === m.userId && a.present)
    ).length;
    return {
      userId: m.userId,
      name: m.user.name,
      sessionsAttended: attended,
      totalSessions,
      attendancePct: totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0,
    };
  });

  summary.sort((a: (typeof summary)[number], b: (typeof summary)[number]) => b.attendancePct - a.attendancePct);
  return NextResponse.json({ totalSessions, summary });
});
