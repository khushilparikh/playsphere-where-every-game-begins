import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// PATCH /api/videos/:id/progress  { watchedSeconds, completed? }
// Task 40, Phase 6: called periodically by the video player (e.g. every
// ~10s) to save watch progress for the logged-in viewer. :id is a
// TrainerVideo id.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const video = await prisma.trainerVideo.findUnique({ where: { id: params.id } });
  if (!video) return jsonError("Video not found", 404);

  const body = await req.json().catch(() => ({}));
  const watchedSeconds = Number(body.watchedSeconds);
  if (!Number.isFinite(watchedSeconds) || watchedSeconds < 0) return jsonError("watchedSeconds must be a non-negative number");

  const progress = await prisma.videoProgress.upsert({
    where: { videoId_userId: { videoId: params.id, userId: user.id } },
    update: { watchedSeconds, completed: !!body.completed },
    create: { videoId: params.id, userId: user.id, watchedSeconds, completed: !!body.completed },
  });

  return NextResponse.json({ progress: { watchedSeconds: progress.watchedSeconds, completed: progress.completed } });
});
