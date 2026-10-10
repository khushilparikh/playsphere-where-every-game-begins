import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

// DELETE /api/trainers/:id/availability/:windowId
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string; windowId: string } }) => {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);

    const trainer = await prisma.trainerProfile.findUnique({ where: { id: params.id } });
    if (!trainer) return jsonError("Trainer not found", 404);
    if (trainer.userId !== user.id) return jsonError("Only the trainer can edit their own availability", 403);

    const window = await prisma.trainerAvailability.findUnique({ where: { id: params.windowId } });
    if (!window || window.trainerId !== params.id) return jsonError("Availability window not found", 404);

    await prisma.trainerAvailability.delete({ where: { id: params.windowId } });
    return NextResponse.json({ ok: true });
  }
);
