import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// GET /api/tournaments/:id/gallery
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const images = await prisma.tournamentGalleryImage.findMany({
    where: { tournamentId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ images });
});

// POST /api/tournaments/:id/gallery { image, caption? }
// `image` is a client-compressed data URL, same pipeline as community posts.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) return jsonError("Tournament not found", 404);
  if (tournament.organizerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  if (!body?.image) return jsonError("An image is required");

  const image = await prisma.tournamentGalleryImage.create({
    data: { tournamentId: params.id, image: body.image, caption: body.caption || null },
  });

  return NextResponse.json({ image }, { status: 201 });
});
