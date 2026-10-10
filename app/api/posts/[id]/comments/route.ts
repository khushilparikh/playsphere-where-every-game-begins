import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeComment } from "@/lib/serializers";
import { notifyUser } from "@/lib/notify";

// GET /api/posts/:id/comments -> newest-last comment thread
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const comments = await prisma.postComment.findMany({
    where: { postId: params.id },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ comments: comments.map(serializeComment) });
});

// POST /api/posts/:id/comments { content } -> add a comment
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const post = await prisma.communityPost.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);

  const body = await req.json().catch(() => ({}));
  const content = body?.content?.trim();
  if (!content) return jsonError("Comment can't be empty");

  const comment = await prisma.postComment.create({
    data: { postId: params.id, authorId: user.id, content },
    include: { author: true },
  });
  await prisma.communityPost.update({ where: { id: params.id }, data: { comments: { increment: 1 } } });

  if (post.authorId !== user.id) {
    await notifyUser({
      userId: post.authorId,
      title: "New comment on your post",
      detail: `${user.name} commented: "${content.slice(0, 80)}"`,
      type: "COMMUNITY",
      groupKey: `comments:${post.id}`, // Task 17 — multiple comments before the author reads them merge into one notification
    });
  }

  return NextResponse.json({ comment: serializeComment(comment) }, { status: 201 });
});
