import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling, serializeUser } from "@/lib/api-format";

// GET /api/admin/users?role=PLAYER  -> every account on the platform (ADMIN only)
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role && role !== "All" ? { role: role as any } : {},
    include: {
      _count: {
        select: { ownedVenues: true, organizedTournaments: true, capitainedTeams: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...serializeUser(u),
      status: u.status,
      venuesOwned: u._count.ownedVenues,
      tournamentsOrganized: u._count.organizedTournaments,
      teamsCaptained: u._count.capitainedTeams,
    })),
  });
});
