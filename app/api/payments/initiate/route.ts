import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { randomUUID } from "crypto";

const db = prisma as any; // type cast — Prisma client types may lag behind schema changes in IDE


export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return jsonError("Invalid JSON body");

  const { targetType, targetId, amount, currency = "INR", method = "UPI" } = rawBody;

  if (!["BOOKING", "TOURNAMENT", "TRAINER_PACKAGE"].includes(targetType)) {
    return jsonError("Invalid targetType");
  }

  if (targetType === "BOOKING") {
    const booking = await prisma.booking.findUnique({ where: { id: targetId } });
    if (!booking) return jsonError("Booking not found", 404);
    if (booking.userId !== user.id) return jsonError("Unauthorized", 403);
    if ((booking as any).paymentStatus === "SUCCESS") return jsonError("Already paid", 400);
  } else if (targetType === "TOURNAMENT") {
    const reg = await prisma.teamRegistration.findUnique({ where: { id: targetId }, include: { team: true } });
    if (!reg) return jsonError("Registration not found", 404);
    if (reg.team.captainId !== user.id) return jsonError("Unauthorized", 403);
    if ((reg as any).paymentStatus === "SUCCESS") return jsonError("Already paid", 400);
  } else if (targetType === "TRAINER_PACKAGE") {
    const purchase = await prisma.packagePurchase.findUnique({ where: { id: targetId } });
    if (!purchase) return jsonError("Purchase not found", 404);
    if (purchase.studentId !== user.id) return jsonError("Unauthorized", 403);
    if ((purchase as any).paymentStatus === "SUCCESS") return jsonError("Already paid", 400);
  }

  const transactionId = `TXN_PLAY_${Math.floor(100000 + Math.random() * 900000)}`;
  const idempotencyKey = randomUUID();
  // 5 minutes expiry
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const payment = await db.paymentTransaction.create({
    data: {
      userId: user.id,
      bookingId: targetType === "BOOKING" ? targetId : null,
      teamRegistrationId: targetType === "TOURNAMENT" ? targetId : null,
      packagePurchaseId: targetType === "TRAINER_PACKAGE" ? targetId : null,
      amount: amount || 0,
      currency,
      method,
      status: "PENDING",
      transactionId,
      idempotencyKey,
      expiresAt,
    }
  });

  // Generate a mock UPI link if UPI
  const upiLink = method === "UPI"
    ? `upi://pay?pa=playsphere.demo@okicici&pn=PlaySphere%20Arena&am=${amount}&tr=${transactionId}`
    : null;

  return NextResponse.json({
    success: true,
    sessionToken: payment.id,
    idempotencyKey,
    expiresAt,
    transactionId,
    upiLink
  });
});
