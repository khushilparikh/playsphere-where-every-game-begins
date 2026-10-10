import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeBatch, serializeStudent } from "@/lib/serializers";

// GET /api/batches  -> the logged-in trainer's batches + their students
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const profile = await prisma.trainerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ batches: [], students: [] });

  const batches = await prisma.trainerBatch.findMany({
    where: { trainerId: profile.id },
    include: { students: true, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });

  const students = batches.flatMap((b) =>
    b.students.map((s) => serializeStudent({ ...s, batch: { name: b.name } }))
  );

  return NextResponse.json({ batches: batches.map(serializeBatch), students });
});

// POST /api/batches  -> trainer creates a new coaching batch
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const profile = await prisma.trainerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return jsonError("Create a trainer profile first (POST /api/trainers)", 400);

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.time || !body?.days) return jsonError("name, time and days are required");

  const batch = await prisma.trainerBatch.create({
    data: {
      trainerId: profile.id,
      name: body.name,
      time: body.time,
      days: body.days,
      venue: body.venue || "TBD",
    },
    include: { _count: { select: { students: true } } },
  });

  return NextResponse.json({ batch: serializeBatch(batch) }, { status: 201 });
});
