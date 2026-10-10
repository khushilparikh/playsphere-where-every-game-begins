import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeVenue } from "@/lib/serializers";

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const venue = await prisma.venue.findUnique({ where: { id: params.id }, include: { images: true } });
  if (!venue) return jsonError("Venue not found", 404);
  return NextResponse.json({ venue: serializeVenue(venue) });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const venue = await prisma.venue.findUnique({ where: { id: params.id } });
  if (!venue) return jsonError("Venue not found", 404);
  if (venue.ownerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));

  if (body.pricePerHour !== undefined && (typeof body.pricePerHour !== "number" || body.pricePerHour <= 0)) {
    return jsonError("A valid hourly rate (pricePerHour) greater than 0 is required.");
  }
  // Task 26, Phase 6: full replace of the gallery when `images` is
  // provided — simplest correct approach for a small per-venue photo set
  // (delete all, recreate) rather than diffing individual add/remove ops.
  if (Array.isArray(body.images)) {
    await prisma.venueImage.deleteMany({ where: { venueId: params.id } });
    if (body.images.length > 0) {
      await prisma.venueImage.createMany({
        data: body.images
          .filter((img: any) => typeof img?.image === "string" && img.image)
          .map((img: any) => ({ venueId: params.id, image: img.image, caption: img.caption ?? null })),
      });
    }
  }

  const updated = await prisma.venue.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      area: body.area ?? undefined,
      address: body.address ?? undefined,
      latitude: typeof body.latitude === "number" ? body.latitude : undefined,
      longitude: typeof body.longitude === "number" ? body.longitude : undefined,
      description: body.description ?? undefined,
      contactPhone: body.contactPhone ?? undefined,
      amenities: Array.isArray(body.amenities) ? body.amenities : undefined,
      pricePerHour: body.pricePerHour ?? undefined,
      slotsLeftToday: body.slotsLeftToday ?? undefined,
      status: body.status ?? undefined,
      cancellationPolicy: body.cancellationPolicy ?? undefined,
    },
    include: { images: true },
  });
  return NextResponse.json({ venue: serializeVenue(updated) });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const venue = await prisma.venue.findUnique({ where: { id: params.id } });
  if (!venue) return jsonError("Venue not found", 404);
  if (venue.ownerId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  await prisma.venue.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
