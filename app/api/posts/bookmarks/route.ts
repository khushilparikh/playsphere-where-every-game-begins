import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializePost } from "@/lib/serializers";

// GET /api/posts/bookmarks -> the logged-in user's saved posts
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const bookmarks = await prisma.postBookmark.findMany({
    where: { userId: user.id },
    include: {
      post: {
        include: {
          author: true,
          postLikes: { where: { userId: user.id } },
          bookmarks: { where: { userId: user.id } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts: bookmarks.map((b) => serializePost(b.post, user.id)) });
});
