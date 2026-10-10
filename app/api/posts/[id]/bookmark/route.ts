import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// POST /api/posts/:id/bookmark -> toggles the logged-in user's bookmark on this post
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const post = await prisma.communityPost.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);

  const existing = await prisma.postBookmark.findUnique({
    where: { postId_userId: { postId: params.id, userId: user.id } },
  });

  if (existing) {
    await prisma.postBookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }

  await prisma.postBookmark.create({ data: { postId: params.id, userId: user.id } });
  return NextResponse.json({ bookmarked: true });
});
