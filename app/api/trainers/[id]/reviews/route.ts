import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializeReview(r: any) {
  return {
    id: r.id,
    trainerId: r.trainerId,
    userId: r.userId,
    userName: r.user?.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  };
}

async function recomputeTrainerRating(trainerId: string) {
  const agg = await prisma.trainerReview.aggregate({
    where: { trainerId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.trainerProfile.update({
    where: { id: trainerId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count,
    },
  });
}

// GET /api/trainers/:id/reviews
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const reviews = await prisma.trainerReview.findMany({
    where: { trainerId: params.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews: reviews.map(serializeReview) });
});

// POST /api/trainers/:id/reviews { rating, comment? }
// One review per student per trainer — posting again updates it.
// Task 37, Phase 6: verified reviews only — the reviewer must have a
// completed TrainingSession or a PackagePurchase with this trainer,
// rather than anyone being able to review without ever training with them.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);

  const [completedSession, purchase] = await Promise.all([
    prisma.trainingSession.findFirst({ where: { trainerId: params.id, studentId: user.id, status: "COMPLETED" } }),
    prisma.packagePurchase.findFirst({ where: { studentId: user.id, package: { trainerId: params.id } } }),
  ]);
  if (!completedSession && !purchase && user.role !== "ADMIN") {
    return jsonError("You can only review a trainer after completing a session or purchasing a package with them.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5) return jsonError("rating must be between 1 and 5");

  const review = await prisma.trainerReview.upsert({
    where: { trainerId_userId: { trainerId: params.id, userId: user.id } },
    update: { rating, comment: body.comment ?? null },
    create: { trainerId: params.id, userId: user.id, rating, comment: body.comment ?? null },
    include: { user: true },
  });

  await recomputeTrainerRating(params.id);

  return NextResponse.json({ review: serializeReview(review) }, { status: 201 });
});
