import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeRegistration } from "@/lib/serializers";
import { notifyUser } from "@/lib/notify";

// PATCH /api/registrations/:id  { status: "APPROVED" | "REJECTED" } — organizer approves/rejects a team
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const registration = await prisma.teamRegistration.findUnique({
    where: { id: params.id },
    include: { tournament: true, team: true },
  });
  if (!registration) return jsonError("Registration not found", 404);
  if (registration.tournament.organizerId !== user.id && user.role !== "ADMIN") {
    return jsonError("Forbidden", 403);
  }

  const body = await req.json().catch(() => ({}));
  if (!["APPROVED", "REJECTED"].includes(body.status)) return jsonError("Invalid status");

  // Guard against double-clicks / duplicate requests: only transition out of
  // PENDING once. If another request already changed the status, this
  // `updateMany` touches zero rows and we skip the revenue increment —
  // this is what previously let the tournament's revenue get bumped twice
  // for the same team when the approve button was clicked rapidly.
  const { count } = await prisma.teamRegistration.updateMany({
    where: { id: params.id, status: "PENDING" },
    data: { status: body.status },
  });
  if (count === 0) {
    return jsonError("This registration was already decided.", 409);
  }

  if (body.status === "APPROVED") {
    await prisma.tournament.update({
      where: { id: registration.tournamentId },
      data: { revenueCollected: { increment: registration.tournament.entryFee } },
    });
  }

  const updated = await prisma.teamRegistration.findUnique({
    where: { id: params.id },
    include: { team: true, tournament: true },
  });

  await notifyUser({
    userId: registration.team.captainId,
    title: body.status === "APPROVED" ? "Team registration approved" : "Team registration rejected",
    detail: registration.tournament.name,
    type: "TOURNAMENT",
  });

  return NextResponse.json({ registration: serializeRegistration(updated) });
});
