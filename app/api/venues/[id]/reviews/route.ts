import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializeReview(r: any) {
  return {
    id: r.id,
    venueId: r.venueId,
    userId: r.userId,
    userName: r.user?.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  };
}

async function recomputeVenueRating(venueId: string) {
  const agg = await prisma.venueReview.aggregate({
    where: { venueId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviews: agg._count,
    },
  });
}

// GET /api/venues/:id/reviews
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const reviews = await prisma.venueReview.findMany({
    where: { venueId: params.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews: reviews.map(serializeReview) });
});

// POST /api/venues/:id/reviews { rating, comment? }
// One review per user per venue — posting again updates the existing review.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const venue = await prisma.venue.findUnique({ where: { id: params.id } });
  if (!venue) return jsonError("Venue not found", 404);

  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5) return jsonError("rating must be between 1 and 5");

  const review = await prisma.venueReview.upsert({
    where: { venueId_userId: { venueId: params.id, userId: user.id } },
    update: { rating, comment: body.comment ?? null },
    create: { venueId: params.id, userId: user.id, rating, comment: body.comment ?? null },
    include: { user: true },
  });

  await recomputeVenueRating(params.id);

  return NextResponse.json({ review: serializeReview(review) }, { status: 201 });
});
