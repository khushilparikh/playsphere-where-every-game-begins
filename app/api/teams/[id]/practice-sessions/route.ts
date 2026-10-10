import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializeSession(s: any, viewerId?: string) {
  return {
    id: s.id,
    teamId: s.teamId,
    title: s.title,
    date: s.date,
    time: s.time,
    venue: s.venue,
    notes: s.notes,
    attendanceCount: s._count?.attendance ?? s.attendance?.length ?? 0,
    presentCount: (s.attendance ?? []).filter((a: any) => a.present).length,
    myAttendance: viewerId ? (s.attendance ?? []).find((a: any) => a.userId === viewerId)?.present ?? null : null,
  };
}

async function requireMember(userId: string, teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
  if (!team) return { error: jsonError("Team not found", 404) };
  const isMember = team.captainId === userId || team.members.some((m) => m.userId === userId);
  if (!isMember) return { error: jsonError("Forbidden", 403) };
  return { team };
}

// GET /api/teams/:id/practice-sessions
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { error } = await requireMember(user.id, params.id);
  if (error) return error;

  const sessions = await prisma.practiceSession.findMany({
    where: { teamId: params.id },
    include: { attendance: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sessions: sessions.map((s) => serializeSession(s, user.id)) });
});

// POST /api/teams/:id/practice-sessions { title, date, time, venue?, notes? }
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { team, error } = await requireMember(user.id, params.id);
  if (error) return error;
  if (team!.captainId !== user.id) return jsonError("Only the captain can schedule practice sessions", 403);

  const body = await req.json().catch(() => ({}));
  if (!body?.title || !body?.date || !body?.time) return jsonError("title, date and time are required");

  const session = await prisma.practiceSession.create({
    data: {
      teamId: params.id,
      title: body.title,
      date: body.date,
      time: body.time,
      venue: body.venue || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json({ session: serializeSession(session) }, { status: 201 });
});
