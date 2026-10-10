import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/tournaments/:id/officials
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const officials = await prisma.tournamentOfficial.findMany({ where: { tournamentId: params.id } });
  return NextResponse.json({ officials });
});

// POST /api/tournaments/:id/officials { name, role, contact? }
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) return jsonError("Tournament not found", 404);
  if (tournament.organizerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  if (!body?.name || !body?.role) return jsonError("name and role are required");

  const official = await prisma.tournamentOfficial.create({
    data: { tournamentId: params.id, name: body.name, role: body.role, contact: body.contact || null },
  });

  return NextResponse.json({ official }, { status: 201 });
});
