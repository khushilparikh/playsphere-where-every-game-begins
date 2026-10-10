import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { TOURNAMENT_STATUS_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeTournament, serializeRegistration } from "@/lib/serializers";

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      organizer: true,
      registrations: { include: { team: true } },
      _count: { select: { registrations: true } },
    },
  });
  if (!tournament) return jsonError("Tournament not found", 404);
  return NextResponse.json({
    tournament: serializeTournament(tournament),
    registrations: tournament.registrations.map(serializeRegistration),
  });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) return jsonError("Tournament not found", 404);
  if (tournament.organizerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const updated = await prisma.tournament.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      format: body.format ?? undefined,
      teamsCap: body.teamsCap ?? undefined,
      entryFee: body.entryFee ?? undefined,
      status: body.status ? ((TOURNAMENT_STATUS_TO_DB[body.status] ?? body.status) as any) : undefined,
    },
    include: { organizer: true, registrations: true },
  });

  return NextResponse.json({ tournament: serializeTournament(updated) });
});
