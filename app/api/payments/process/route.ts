import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { logAudit } from "@/lib/audit";

const db = prisma as any; // type cast — Prisma client types may lag behind schema changes in IDE


export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return jsonError("Invalid JSON body");

  const { sessionToken, idempotencyKey, simulateFailure, authCode } = rawBody;

  if (!sessionToken || !idempotencyKey) {
    return jsonError("Missing session or idempotency key");
  }

  // Find the pending transaction
  const payment = await db.paymentTransaction.findUnique({
    where: { id: sessionToken }
  });

  if (!payment) return jsonError("Payment session not found", 404);
  if (payment.userId !== user.id) return jsonError("Unauthorized", 403);
  if (payment.idempotencyKey !== idempotencyKey) return jsonError("Idempotency mismatch", 400);

  if (payment.status !== "PENDING") {
    return jsonError(`Payment already processed (Status: ${payment.status})`, 400);
  }

  if (new Date(payment.expiresAt).getTime() < Date.now()) {
    await db.paymentTransaction.update({
      where: { id: payment.id },
      data: { status: "EXPIRED", failureReason: "Session Timed Out" }
    });
    if (payment.bookingId) {
      await db.booking.update({ where: { id: payment.bookingId }, data: { paymentStatus: "EXPIRED", status: "DECLINED" } });
    }
    logAudit(user.id, "PAYMENT", "PAYMENT_EXPIRED", "PaymentTransaction", payment.id, "Payment session timed out", user.role);
    return jsonError("Session Expired", 410);
  }

  // Simulate Auth Code failure (e.g., OTP or UPI PIN)
  if (payment.method !== "WALLET" && (!authCode || (authCode !== "123456" && authCode.length !== 4 && authCode.length !== 6))) {
    // Not strictly failing the whole session to allow retry, just return error
    return jsonError("Invalid Authorization Code", 400);
  }

  if (simulateFailure) {
    await db.paymentTransaction.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: "Simulated Decline/Failure" }
    });
    if (payment.bookingId) {
      await db.booking.update({ where: { id: payment.bookingId }, data: { paymentStatus: "FAILED", status: "DECLINED" } });
    }
    logAudit(user.id, "PAYMENT", "PAYMENT_FAILED", "PaymentTransaction", payment.id, "Simulated failure", user.role);
    return jsonError("Payment Declined", 400);
  }

  // Atomic update using Prisma interactive transaction
  await prisma.$transaction(async (tx) => {
    const txDb = tx as any;

    // 1. Mark Payment as SUCCESS
    await txDb.paymentTransaction.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", authStepCompleted: true }
    });

    // 2. Update Target Entity status
    if (payment.bookingId) {
      await txDb.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: "SUCCESS" } // Leave status as PENDING for owner approval
      });
    } else if (payment.teamRegistrationId) {
      await txDb.teamRegistration.update({
        where: { id: payment.teamRegistrationId },
        data: { paymentStatus: "SUCCESS" } // Leave status as PENDING for organizer approval
      });
    } else if (payment.packagePurchaseId) {
      await txDb.packagePurchase.update({
        where: { id: payment.packagePurchaseId },
        data: { paymentStatus: "SUCCESS" }
      });
    }
  });

  logAudit(user.id, "PAYMENT", "PAYMENT_SUCCESS", "PaymentTransaction", payment.id, `Paid ${payment.currency} ${payment.amount} via ${payment.method}`, user.role);

  return NextResponse.json({
    success: true,
    transactionId: payment.transactionId,
    message: "Payment Processed Successfully"
  });
});
