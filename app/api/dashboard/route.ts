import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import {
  serializeMatch, serializeTournament, serializeVenue, serializePost,
  serializeTeam, serializeRegistration, serializeBooking,
  serializeBatch, serializeStudent, serializeInquiry,
} from "@/lib/serializers";

// GET /api/dashboard  -> one call, shaped for whichever role is logged in.
// This mirrors exactly what PlayerDashboard / OrganizerDashboard /
// VenueDashboard / TrainerDashboard render, so those components can swap
// their `lib/mock-data.ts` imports for a single fetch with minimal changes.
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  if (user.role === "PLAYER") {
    const [liveMatches, tournaments, venues, posts] = await Promise.all([
      prisma.liveMatch.findMany({ include: { venue: true }, take: 6, orderBy: { updatedAt: "desc" } }),
      prisma.tournament.findMany({
        where: { status: "REGISTRATION_OPEN" },
        include: { organizer: true, registrations: true },
        take: 2,
      }),
      prisma.venue.findMany({ where: { status: "ACTIVE" }, take: 2 }),
      prisma.communityPost.findMany({ include: { author: true }, take: 2, orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({
      role: "player",
      liveMatches: liveMatches.map(serializeMatch),
      tournamentsOpen: tournaments.map(serializeTournament),
      nearbyVenues: venues.map(serializeVenue),
      feed: posts.map((p) => serializePost(p, user.id)),
    });
  }

  if (user.role === "ORGANIZER") {
    const tournaments = await prisma.tournament.findMany({
      where: { organizerId: user.id },
      include: { organizer: true, registrations: { include: { team: true } } },
      orderBy: { createdAt: "desc" },
    });
    const pending = tournaments
      .flatMap((t) => t.registrations.filter((r) => r.status === "PENDING").map((r) => ({ ...r, tournament: t })))
      .map(serializeRegistration);

    return NextResponse.json({
      role: "organizer",
      tournaments: tournaments.map(serializeTournament),
      pendingRegistrations: pending,
      totalTeams: tournaments.reduce((s, t) => s + t.registrations.filter((r) => r.status === "APPROVED").length, 0),
      totalRevenue: tournaments.reduce((s, t) => s + t.revenueCollected, 0),
    });
  }

  if (user.role === "VENUE_OWNER") {
    const [venues, bookingRequests] = await Promise.all([
      prisma.venue.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
      prisma.booking.findMany({
        where: { venue: { ownerId: user.id }, status: "PENDING" },
        include: { venue: true, user: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return NextResponse.json({
      role: "venue",
      venues: venues.map(serializeVenue),
      bookingRequests: bookingRequests.map(serializeBooking),
    });
  }

  if (user.role === "TRAINER") {
    const profile = await prisma.trainerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ role: "trainer", batches: [], students: [], inquiries: [] });

    const [batches, inquiries] = await Promise.all([
      prisma.trainerBatch.findMany({
        where: { trainerId: profile.id },
        include: { students: true, _count: { select: { students: true } } },
      }),
      prisma.inquiry.findMany({ where: { trainerId: profile.id }, orderBy: { createdAt: "desc" } }),
    ]);
    const students = batches.flatMap((b) => b.students.map((s) => serializeStudent({ ...s, batch: { name: b.name } })));

    return NextResponse.json({
      role: "trainer",
      batches: batches.map(serializeBatch),
      students,
      inquiries: inquiries.map(serializeInquiry),
    });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ role: "admin", redirectTo: "/admin" });
  }

  return jsonError("No dashboard defined for this role", 400);
});
