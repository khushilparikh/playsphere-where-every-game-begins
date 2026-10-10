import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeTeam } from "@/lib/serializers";
import { awardXp, awardBadge, XP_REWARDS } from "@/lib/gamification";

// GET /api/teams               -> teams captained by, or including, the logged-in user
// GET /api/teams?all=true      -> every team (used when picking a team to register for a tournament)
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  const teams = await prisma.team.findMany({
    where: all
      ? {}
      : { OR: [{ captainId: user.id }, { members: { some: { userId: user.id } } }] },
    include: { captain: true, _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ teams: teams.map(serializeTeam) });
});

// POST /api/teams  -> create a new team (creator becomes captain)
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.sport) return jsonError("name and sport are required");

  const team = await prisma.team.create({
    data: {
      name: body.name,
      sport: (SPORT_TO_DB[body.sport] ?? body.sport) as any,
      captainId: user.id,
      logoColor: body.logoColor || "#FF4757",
      logo: body.logo || undefined,
      coachName: body.coachName || undefined,
      coachContact: body.coachContact || undefined,
      members: { create: [{ userId: user.id, roleName: "Captain" }] },
    },
    include: { captain: true, _count: { select: { members: true } } },
  });

  await awardXp(user.id, XP_REWARDS.TEAM_CREATED);
  await awardBadge(user.id, "FIRST_TEAM");

  return NextResponse.json({ team: serializeTeam(team) }, { status: 201 });
});
