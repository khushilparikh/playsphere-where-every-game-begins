import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeInquiry } from "@/lib/serializers";

// GET /api/inquiries  -> inquiries received by the logged-in trainer
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const profile = await prisma.trainerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ inquiries: [] });

  const inquiries = await prisma.inquiry.findMany({
    where: { trainerId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ inquiries: inquiries.map(serializeInquiry) });
});

// POST /api/inquiries  { trainerId, message }  -> a player messages a trainer
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.trainerId || !body?.message) return jsonError("trainerId and message are required");

  const inquiry = await prisma.inquiry.create({
    data: {
      trainerId: body.trainerId,
      fromId: user.id,
      fromName: user.name,
      message: body.message,
    },
  });

  return NextResponse.json({ inquiry: serializeInquiry(inquiry) }, { status: 201 });
});
