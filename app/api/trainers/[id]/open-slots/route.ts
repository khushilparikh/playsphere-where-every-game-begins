import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { computeOpenSlots } from "@/lib/trainer-availability";

// GET /api/trainers/:id/open-slots?date=YYYY-MM-DD
// Public — anyone browsing a trainer needs to see open slots before booking.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError("date query param (YYYY-MM-DD) is required");

  const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
  if (!trainer) return jsonError("Trainer not found", 404);

  const [windows, existingSessions] = await Promise.all([
    prisma.trainerAvailability.findMany({ where: { trainerId: params.id } }),
    prisma.trainingSession.findMany({
      where: { trainerId: params.id, date, status: { not: "CANCELLED" } },
      select: { time: true },
    }),
  ]);

  const openSlots = computeOpenSlots(windows, date, existingSessions.map((s: (typeof existingSessions)[number]) => s.time));
  return NextResponse.json({ openSlots, hasAvailabilitySet: windows.length > 0 });
});
