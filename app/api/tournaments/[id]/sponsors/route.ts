import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

async function requireOrganizer(userId: string, tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return { error: jsonError("Tournament not found", 404) };
  return { tournament };
}

// GET /api/tournaments/:id/sponsors
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const sponsors = await prisma.tournamentSponsor.findMany({ where: { tournamentId: params.id } });
  return NextResponse.json({ sponsors });
});

// POST /api/tournaments/:id/sponsors { name, logo?, tier? }
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { tournament, error } = await requireOrganizer(user.id, params.id);
  if (error) return error;
  if (tournament!.organizerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  if (!body?.name) return jsonError("Sponsor name is required");

  const sponsor = await prisma.tournamentSponsor.create({
    data: { tournamentId: params.id, name: body.name, logo: body.logo || null, tier: body.tier || "Silver" },
  });

  return NextResponse.json({ sponsor }, { status: 201 });
});
