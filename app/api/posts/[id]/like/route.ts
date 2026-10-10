import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// POST /api/posts/:id/like -> toggles the logged-in user's like on this post
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const post = await prisma.communityPost.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: params.id, userId: user.id } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    const updated = await prisma.communityPost.update({
      where: { id: params.id },
      data: { likes: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false, likes: updated.likes });
  }

  await prisma.postLike.create({ data: { postId: params.id, userId: user.id } });
  const updated = await prisma.communityPost.update({
    where: { id: params.id },
    data: { likes: { increment: 1 } },
  });
  return NextResponse.json({ liked: true, likes: updated.likes });
});
