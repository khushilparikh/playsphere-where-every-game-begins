import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeTrainer } from "@/lib/serializers";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

// GET /api/trainers?sport=Football  -> public trainer directory
// GET /api/trainers?mine=true       -> the logged-in trainer's own profile
export const GET = withErrorHandling(async (req: NextRequest) => {
  if (!checkRateLimit(`trainers-get:${clientIp(req)}`, 60, 60 * 1000)) {
    return jsonError("Too many requests. Please slow down and try again shortly.", 429);
  }

  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const mine = searchParams.get("mine");

  if (mine === "true") {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);
    const trainer = await prisma.trainerProfile.findUnique({ where: { userId: user.id }, include: { user: true } });
    return NextResponse.json({ trainers: trainer ? [serializeTrainer(trainer)] : [] });
  }

  const trainers = await prisma.trainerProfile.findMany({
    where: {
      status: "ACTIVE", // Task 5/6, Phase 2: hide unverified profiles from the public directory
      ...(sport && sport !== "All" ? { sport: (SPORT_TO_DB[sport] ?? sport) as any } : {}),
    },
    include: { user: true },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json({ trainers: trainers.map(serializeTrainer) });
});

// POST /api/trainers  -> create/update the logged-in trainer's public profile
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "TRAINER" && user.role !== "ADMIN") return jsonError("Only trainers can do this", 403);

  const body = await req.json().catch(() => null);
  if (!body?.sport) return jsonError("sport is required");

  const sessionModes = Array.isArray(body.sessionModes) && body.sessionModes.length
    ? body.sessionModes.map((m: string) => m.toUpperCase())
    : undefined;

  const profile = await prisma.trainerProfile.upsert({
    where: { userId: user.id },
    update: {
      sport: (SPORT_TO_DB[body.sport] ?? body.sport) as any,
      experience: body.experience,
      area: body.area,
      price: body.price,
      tag: body.tag,
      bio: body.bio,
      specializations: Array.isArray(body.specializations) ? body.specializations : undefined,
      certifications: Array.isArray(body.certifications) ? body.certifications : undefined,
      languages: Array.isArray(body.languages) ? body.languages : undefined,
      introVideo: body.introVideo,
      responseTime: body.responseTime,
      sessionModes,
    },
    create: {
      userId: user.id,
      sport: (SPORT_TO_DB[body.sport] ?? body.sport) as any,
      experience: body.experience || "New trainer",
      area: body.area || user.area || "Ahmedabad",
      price: body.price || "₹600/session",
      tag: body.tag,
      bio: body.bio,
      specializations: Array.isArray(body.specializations) ? body.specializations : [],
      certifications: Array.isArray(body.certifications) ? body.certifications : [],
      languages: Array.isArray(body.languages) ? body.languages : [],
      introVideo: body.introVideo,
      responseTime: body.responseTime,
      sessionModes: sessionModes ?? ["OFFLINE"],
    },
    include: { user: true },
  });

  return NextResponse.json({ trainer: serializeTrainer(profile) }, { status: 201 });
});
