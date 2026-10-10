import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializePurchase(p: any) {
  return {
    id: p.id,
    packageId: p.packageId,
    packageName: p.package?.name,
    trainerId: p.package?.trainerId,
    trainerName: p.package?.trainer?.user?.name,
    sessionCount: p.package?.sessionCount,
    sessionsUsed: p.sessionsUsed,
    sessionsRemaining: (p.package?.sessionCount ?? 0) - p.sessionsUsed,
    purchasedAt: p.purchasedAt,
    expiresAt: p.expiresAt,
    mode: p.package?.mode,
    expired: new Date(p.expiresAt) < new Date(),
  };
}

// GET /api/my-packages -> the logged-in student's package purchases
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const purchases = await prisma.packagePurchase.findMany({
    where: { studentId: user.id },
    include: { package: { include: { trainer: { include: { user: true } } } } },
    orderBy: { purchasedAt: "desc" },
  });

  return NextResponse.json({ purchases: purchases.map(serializePurchase) });
});
