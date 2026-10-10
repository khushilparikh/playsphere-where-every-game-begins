import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { awardXp, XP_REWARDS } from "@/lib/gamification";
import { notifyUser } from "@/lib/notify";

function serializePurchase(p: any) {
  return {
    id: p.id,
    packageId: p.packageId,
    packageName: p.package?.name,
    trainerId: p.package?.trainerId,
    studentId: p.studentId,
    sessionCount: p.package?.sessionCount,
    sessionsUsed: p.sessionsUsed,
    sessionsRemaining: (p.package?.sessionCount ?? 0) - p.sessionsUsed,
    purchasedAt: p.purchasedAt,
    expiresAt: p.expiresAt,
    mode: p.package?.mode,
  };
}

// POST /api/packages/:id/purchase
// Note: this records the purchase/enrollment itself — no live payment
// gateway is wired up (that needs a paid provider + API keys you'd supply),
// so this represents the booking/enrollment record a real checkout would
// create, not an actual money transaction.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const pkg = await prisma.trainerPackage.findUnique({ where: { id: params.id }, include: { trainer: true } });
  if (!pkg) return jsonError("Package not found", 404);
  if (!pkg.active) return jsonError("This package is no longer available", 400);
  if (pkg.trainer.userId === user.id) return jsonError("You can't purchase your own package", 400);

  const expiresAt = new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000);

  const purchase = await prisma.packagePurchase.create({
    data: { packageId: params.id, studentId: user.id, expiresAt },
    include: { package: true },
  });

  await prisma.trainerProfile.update({
    where: { id: pkg.trainerId },
    data: { studentCount: { increment: 1 } },
  });

  await notifyUser({
    userId: pkg.trainer.userId,
    title: "New package purchase",
    detail: `${user.name} enrolled in "${pkg.name}"`,
    type: "COMMUNITY",
  });

  await awardXp(user.id, XP_REWARDS.VENUE_BOOKED); // reuse the standard "booked something" reward

  return NextResponse.json({ purchase: serializePurchase(purchase) }, { status: 201 });
});
