import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializePost } from "@/lib/serializers";
import { extractHashtags } from "@/lib/hashtags";

// Task 13, Phase 3: author-only edit/delete for a community post — was
// entirely missing (POST /api/posts existed, but nothing let the author
// change or remove a post afterward).

// PATCH /api/posts/:id  { content?, sport?, image? }
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const post = await prisma.communityPost.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    return jsonError("Only the author can edit this post", 403);
  }

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const content = typeof body.content === "string" ? body.content.trim() : post.content;
  const image = body.image !== undefined ? body.image : post.image;
  if (!content && !image) return jsonError("A post needs text or a photo.");

  // Task 36, Phase 6: full replace of the gallery when `images` is
  // provided, same simple approach as the venue gallery (Task 26).
  if (Array.isArray(body.images)) {
    await prisma.communityPostImage.deleteMany({ where: { postId: params.id } });
    const extraImages = body.images.filter((i: any) => typeof i === "string" && i);
    if (extraImages.length > 0) {
      await prisma.communityPostImage.createMany({
        data: extraImages.map((image: string, order: number) => ({ postId: params.id, image, order })),
      });
    }
  }

  const updated = await prisma.communityPost.update({
    where: { id: params.id },
    data: {
      content,
      image,
      sport: body.sport ? ((SPORT_TO_DB[body.sport] ?? body.sport) as any) : undefined,
      tags: extractHashtags(content),
    },
    include: { author: true, images: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ post: serializePost(updated, user.id) });
});

// DELETE /api/posts/:id
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const post = await prisma.communityPost.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    return jsonError("Only the author can delete this post", 403);
  }

  await prisma.communityPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
