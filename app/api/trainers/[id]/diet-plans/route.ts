import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializePlan(p: any, locked: boolean) {
  return {
    id: p.id,
    trainerId: p.trainerId,
    title: p.title,
    goal: p.goal,
    description: locked ? null : p.description,
    isPremium: p.isPremium,
    isTemplate: p.isTemplate ?? false, // Task 39, Phase 6
    locked,
    createdAt: p.createdAt,
  };
}

async function hasActivePackage(userId: string, trainerId: string) {
  const now = new Date();
  const purchase = await prisma.packagePurchase.findFirst({
    where: { studentId: userId, expiresAt: { gt: now }, package: { trainerId } },
  });
  return !!purchase;
}

// GET /api/trainers/:id/diet-plans
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);

  const isOwner = user && (user.id === trainer.userId || user.role === "ADMIN");
  const unlocked = isOwner || (user ? await hasActivePackage(user.id, params.id) : false);

  const plans = await prisma.trainerDietPlan.findMany({ where: { trainerId: params.id }, orderBy: { createdAt: "desc" } });

  return NextResponse.json({ plans: plans.map((p) => serializePlan(p, p.isPremium && !unlocked)) });
});

// POST /api/trainers/:id/diet-plans { title, goal, description, isPremium?, isTemplate?, fromTemplateId? }
// Task 39, Phase 6: `fromTemplateId` clones an existing template's
// goal/description as starting values (still requires title/goal/
// description in the body — the frontend pre-fills them from the
// template rather than this route silently pulling old data server-side).
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);
  if (trainer.userId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  if (!body?.title || !body?.goal || !body?.description) return jsonError("title, goal and description are required");

  const plan = await prisma.trainerDietPlan.create({
    data: {
      trainerId: params.id,
      title: body.title,
      goal: body.goal,
      description: body.description,
      isPremium: !!body.isPremium,
      isTemplate: !!body.isTemplate,
    },
  });

  return NextResponse.json({ plan: serializePlan(plan, false) }, { status: 201 });
});
