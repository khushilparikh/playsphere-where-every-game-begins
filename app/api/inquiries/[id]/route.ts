import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeInquiry } from "@/lib/serializers";

// PATCH /api/inquiries/:id  { reply }  -> trainer replies to an inquiry
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const profile = await prisma.trainerProfile.findUnique({ where: { userId: user.id } });
  const inquiry = await prisma.inquiry.findUnique({ where: { id: params.id } });
  if (!inquiry) return jsonError("Inquiry not found", 404);
  if (!profile || inquiry.trainerId !== profile.id) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const updated = await prisma.inquiry.update({
    where: { id: params.id },
    data: { reply: body.reply },
  });

  return NextResponse.json({ inquiry: serializeInquiry(updated) });
});
