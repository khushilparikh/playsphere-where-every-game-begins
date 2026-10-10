import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// POST /api/users/me/followed-tags  { tag, follow: boolean }
// Task 35, Phase 6: toggles a hashtag in/out of the current user's
// followedTags list, used by GET /api/posts?sort=following.
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  const tag = typeof body?.tag === "string" ? body.tag.trim().toLowerCase() : "";
  if (!tag) return jsonError("tag is required");

  const current = new Set(user.followedTags ?? []);
  if (body.follow === false) {
    current.delete(tag);
  } else {
    current.add(tag);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { followedTags: Array.from(current) },
    select: { followedTags: true },
  });

  return NextResponse.json({ followedTags: updated.followedTags });
});
