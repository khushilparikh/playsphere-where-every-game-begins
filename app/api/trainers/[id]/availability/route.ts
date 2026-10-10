import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function serializeWindow(w: any) {
  return { id: w.id, dayOfWeek: w.dayOfWeek, day: DAY_NAMES[w.dayOfWeek], startTime: w.startTime, endTime: w.endTime };
}

// GET /api/trainers/:id/availability -> this trainer's weekly windows (public — anyone booking needs to see them)
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const windows = await prisma.trainerAvailability.findMany({
    where: { trainerId: params.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json({ availability: windows.map(serializeWindow) });
});

// POST /api/trainers/:id/availability { dayOfWeek, startTime, endTime }
// Trainer-only: adds one weekly window (e.g. "Monday 09:00–12:00").
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);
  if (trainer.userId !== user.id) return jsonError("Only the trainer can edit their own availability", 403);

  const body = await req.json().catch(() => null);
  const dayOfWeek = Number(body?.dayOfWeek);
  const startTime = String(body?.startTime ?? "");
  const endTime = String(body?.endTime ?? "");

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return jsonError("dayOfWeek must be 0–6 (Sunday–Saturday)");
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) return jsonError("startTime/endTime must be in HH:MM format");
  if (startTime >= endTime) return jsonError("startTime must be before endTime");

  const window = await prisma.trainerAvailability.create({
    data: { trainerId: params.id, dayOfWeek, startTime, endTime },
  });

  return NextResponse.json({ availability: serializeWindow(window) }, { status: 201 });
});
