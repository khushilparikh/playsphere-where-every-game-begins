import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeAcademy } from "@/lib/serializers";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

// GET /api/academies              -> public academy directory (ACTIVE only)
// GET /api/academies?mine=true    -> academies owned by the logged-in user, any status
export const GET = withErrorHandling(async (req: NextRequest) => {
  if (!checkRateLimit(`academies-get:${clientIp(req)}`, 60, 60 * 1000)) {
    return jsonError("Too many requests. Please slow down and try again shortly.", 429);
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("mine") === "true") {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);
    const academies = await prisma.academy.findMany({ where: { ownerId: user.id }, orderBy: { rating: "desc" } });
    return NextResponse.json({ academies: academies.map(serializeAcademy) });
  }

  const academies = await prisma.academy.findMany({
    where: { status: "ACTIVE" }, // Task 5/6, Phase 2: hide unverified academies from the public directory
    orderBy: { rating: "desc" },
  });
  return NextResponse.json({ academies: academies.map(serializeAcademy) });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.sports?.length) return jsonError("name and sports are required");

  const academy = await prisma.academy.create({
    data: {
      ownerId: user.id,
      name: body.name,
      sports: (body.sports as string[]).map((s) => SPORT_TO_DB[s] ?? s) as any,
      area: body.area || user.area || "Ahmedabad",
      established: body.established || String(new Date().getFullYear()),
    },
  });

  return NextResponse.json({ academy: serializeAcademy(academy) }, { status: 201 });
});
