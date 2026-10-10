import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SPORT_TO_DB, jsonError, withErrorHandling } from "@/lib/api-format";
import { serializeVenue } from "@/lib/serializers";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// GET /api/venues                -> public browse list (?sport=&area=&q=)
// GET /api/venues?mine=true      -> venues owned by the logged-in Venue Owner
export const GET = withErrorHandling(async (req: NextRequest) => {
  // Generous limit compared to auth routes — this is a legitimate
  // high-traffic public read, not a sensitive action, so it only needs
  // to guard against scraping/abuse rather than brute-force attempts.
  if (!checkRateLimit(`venues-get:${clientIp(req)}`, 60, 60 * 1000)) {
    return jsonError("Too many requests. Please slow down and try again shortly.", 429);
  }

  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const area = searchParams.get("area");
  const q = searchParams.get("q");
  const mine = searchParams.get("mine");

  const where: any = {};

  if (mine === "true") {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Not authenticated", 401);
    where.ownerId = user.id;
  } else {
    where.status = "ACTIVE";
  }

  if (sport && sport !== "All") where.sports = { has: SPORT_TO_DB[sport] ?? sport };
  if (area && area !== "All") where.area = area;
  if (q) where.name = { contains: q, mode: "insensitive" };

  const venues = await prisma.venue.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ venues: venues.map(serializeVenue) });
});

// POST /api/venues  -> create a new venue listing (Venue Owner only)
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "VENUE_OWNER" && user.role !== "ADMIN") {
    return jsonError("Only venue owners can list venues", 403);
  }

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.sports?.length) return jsonError("name and sports are required");
  if (!body?.address) return jsonError("A full address is required so players can find the venue.");
  if (typeof body?.pricePerHour !== "number" || body.pricePerHour <= 0) {
    return jsonError("A valid hourly rate (pricePerHour) greater than 0 is required.");
  }

  const venue = await prisma.venue.create({
    data: {
      ownerId: user.id,
      name: body.name,
      area: body.area || user.area || "Ahmedabad",
      address: body.address,
      latitude: typeof body.latitude === "number" ? body.latitude : null,
      longitude: typeof body.longitude === "number" ? body.longitude : null,
      description: body.description || null,
      contactPhone: body.contactPhone || user.phone || null,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      sports: (body.sports as string[]).map((s) => SPORT_TO_DB[s] ?? s) as any,
      pricePerHour: body.pricePerHour ?? 800,
      image: body.image,
      status: "ACTIVE",
    },
  });

  logAudit(user.id, "VENUE", "VENUE_CREATED", "Venue", venue.id, venue.name, user.role);

  return NextResponse.json({ venue: serializeVenue(venue) }, { status: 201 });
});
