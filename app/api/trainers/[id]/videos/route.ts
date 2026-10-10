import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializeVideo(v: any) {
  return {
    id: v.id,
    trainerId: v.trainerId,
    title: v.title,
    description: v.description,
    url: v.url,
    thumbnail: v.thumbnail,
    category: v.category,
    isPremium: v.isPremium,
    createdAt: v.createdAt,
  };
}

async function hasActivePackage(userId: string, trainerId: string) {
  const now = new Date();
  const purchase = await prisma.packagePurchase.findFirst({
    where: { studentId: userId, expiresAt: { gt: now }, package: { trainerId } },
  });
  return !!purchase;
}

// GET /api/trainers/:id/videos -> the trainer's video library.
// Premium videos are only returned in full to the trainer themself, an
// admin, or a student with an active (non-expired) package purchase from
// this trainer — everyone else sees them listed but locked.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);

  const isOwner = user && (user.id === trainer.userId || user.role === "ADMIN");
  const unlocked = isOwner || (user ? await hasActivePackage(user.id, params.id) : false);

  const videos = await prisma.trainerVideo.findMany({
    where: { trainerId: params.id },
    orderBy: { createdAt: "desc" },
    include: { viewProgress: user ? { where: { userId: user.id } } : false },
  });

  return NextResponse.json({
    videos: videos.map((v) => ({
      ...serializeVideo(v),
      url: v.isPremium && !unlocked ? null : v.url, // hide the actual link if locked
      locked: v.isPremium && !unlocked,
      // Task 40, Phase 6: the viewer's own progress on this video, if any.
      myProgress: v.viewProgress?.[0]
        ? { watchedSeconds: v.viewProgress[0].watchedSeconds, completed: v.viewProgress[0].completed }
        : null,
    })),
  });
});

// POST /api/trainers/:id/videos { title, url, description?, category?, isPremium? }
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);
  if (trainer.userId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  if (!body?.title || !body?.url) return jsonError("title and url are required");

  const video = await prisma.trainerVideo.create({
    data: {
      trainerId: params.id,
      title: body.title,
      description: body.description || null,
      url: body.url,
      thumbnail: body.thumbnail || null,
      category: body.category || null,
      isPremium: !!body.isPremium,
    },
  });

  return NextResponse.json({ video: serializeVideo(video) }, { status: 201 });
});
