import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

function serializePackage(p: any) {
  return {
    id: p.id,
    trainerId: p.trainerId,
    name: p.name,
    description: p.description,
    sessionCount: p.sessionCount,
    validityDays: p.validityDays,
    price: p.price,
    mode: p.mode?.charAt(0) + p.mode?.slice(1).toLowerCase(),
    active: p.active,
  };
}

async function requireOwner(userId: string, trainerId: string, role: string) {
  const trainer = await prisma.trainerProfile.findUnique({ where: { id: trainerId } });
  if (!trainer) return { error: jsonError("Trainer not found", 404) };
  if (trainer.userId !== userId && role !== "ADMIN") return { error: jsonError("Forbidden", 403) };
  return { trainer };
}

// GET /api/trainers/:id/packages -> public list of active packages
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const packages = await prisma.trainerPackage.findMany({
    where: { trainerId: params.id, active: true },
    orderBy: { price: "asc" },
  });
  return NextResponse.json({ packages: packages.map(serializePackage) });
});

// POST /api/trainers/:id/packages { name, sessionCount, price, description?, validityDays?, mode? }
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { error } = await requireOwner(user.id, params.id, user.role);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body?.name || !body?.sessionCount || !body?.price) {
    return jsonError("name, sessionCount and price are required");
  }

  const pkg = await prisma.trainerPackage.create({
    data: {
      trainerId: params.id,
      name: body.name,
      description: body.description || null,
      sessionCount: Number(body.sessionCount),
      validityDays: body.validityDays ? Number(body.validityDays) : 30,
      price: Number(body.price),
      mode: (body.mode ?? "OFFLINE").toUpperCase(),
    },
  });

  return NextResponse.json({ package: serializePackage(pkg) }, { status: 201 });
});
