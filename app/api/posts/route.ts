import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializePost } from "@/lib/serializers";
import { extractHashtags } from "@/lib/hashtags";
import { awardXp, awardBadge, XP_REWARDS } from "@/lib/gamification";

// GET /api/posts?sport=Cricket&tag=cricket&sort=trending|following   -> community feed
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort"); // "trending" | "following" | null (= newest)
  const viewer = await getAuthUser(req);

  const where: any = {};
  if (sport && sport !== "All") where.sport = SPORT_TO_DB[sport] ?? sport;
  if (tag) where.tags = { has: tag.toLowerCase() };
  // Task 34, Phase 6: auto-hidden posts (see POST /api/admin/reports)
  // stay out of everyone's feed except the author's own and an admin's.
  if (!viewer || viewer.role !== "ADMIN") {
    where.OR = [{ hidden: false }, ...(viewer ? [{ hidden: true, authorId: viewer.id }] : [])];
  }

  // Task 35, Phase 6: "following" filters to posts tagged with something
  // the viewer follows (User.followedTags); if they don't follow
  // anything yet, falls back to the normal feed rather than showing
  // nothing.
  if (sort === "following" && viewer?.followedTags?.length) {
    where.tags = { hasSome: viewer.followedTags };
  }

  const posts = await prisma.communityPost.findMany({
    where,
    include: {
      author: true,
      postLikes: viewer ? { where: { userId: viewer.id } } : false,
      bookmarks: viewer ? { where: { userId: viewer.id } } : false,
      images: { orderBy: { order: "asc" } },
    },
    // "trending" ranks by engagement within a recent window rather than
    // pure recency — a 3-day window keeps it from surfacing month-old
    // posts that happened to accumulate likes over a long time.
    orderBy: sort === "trending" ? undefined : { createdAt: "desc" },
    take: 50,
  });

  let result = posts;
  if (sort === "trending") {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    result = [...posts].sort((a, b) => {
      const aRecent = a.createdAt.getTime() >= threeDaysAgo;
      const bRecent = b.createdAt.getTime() >= threeDaysAgo;
      const aScore = (aRecent ? 1 : 0.3) * (a.likes * 2 + a.comments * 3);
      const bScore = (bRecent ? 1 : 0.3) * (b.likes * 2 + b.comments * 3);
      return bScore - aScore;
    });
  }

  return NextResponse.json({ posts: result.map((p) => serializePost(p, viewer?.id)) });
});

// POST /api/posts  -> create a community post
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.content?.trim() && !body?.image && !(Array.isArray(body?.images) && body.images.length > 0)) {
    return jsonError("Write something or add a photo first.");
  }

  const content = body.content?.trim() || "";
  // Task 36, Phase 6: `images` is an optional array of extra photos
  // beyond the single cover `image` — a post can have just a cover image
  // (existing behavior, unchanged) or a small gallery.
  const extraImages: string[] = Array.isArray(body.images) ? body.images.filter((i: any) => typeof i === "string" && i) : [];

  const post = await prisma.communityPost.create({
    data: {
      authorId: user.id,
      content,
      sport: body.sport ? ((SPORT_TO_DB[body.sport] ?? body.sport) as any) : undefined,
      image: body.image,
      tags: extractHashtags(content),
      images: extraImages.length > 0 ? { create: extraImages.map((image, order) => ({ image, order })) } : undefined,
    },
    include: { author: true, images: { orderBy: { order: "asc" } } },
  });

  await awardXp(user.id, XP_REWARDS.POST_CREATED);
  await awardBadge(user.id, "FIRST_POST");

  return NextResponse.json({ post: serializePost(post, user.id) }, { status: 201 });
});
