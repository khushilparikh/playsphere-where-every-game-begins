import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";

const db = prisma as any; // type cast — Prisma client types may lag behind schema changes in IDE


export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const { searchParams } = new URL(req.url);
  const asAdmin = searchParams.get("asAdmin") === "true";

  let transactions;

  if (asAdmin && user.role === "ADMIN") {
    transactions = await db.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        booking: { include: { venue: true } },
        teamReg: { include: { tournament: true } },
      }
    });
  } else {
    transactions = await db.paymentTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        booking: { include: { venue: true } },
        teamReg: { include: { tournament: true } },
        packagePurchase: { include: { package: true } }
      }
    });
  }

  return NextResponse.json({ transactions });
});
