// Seeds the database with:
//  - 5 demo accounts (one per role, including admin) with a known password
//    so the "Continue as" / "Preview as" role switcher in the frontend works
//    out of the box
//  - A realistic set of venues, tournaments, teams, posts, player requests,
//    trainer/academy data, live matches, bookings and notifications
//
// This is OPTIONAL and no longer runs automatically. Run it explicitly
// with:  npm run db:seed:demo
// Skip this entirely if you want every player/venue owner/organizer/trainer
// to enter their own real data through the Register page instead — pick
// "Admin" as the role there (with the ADMIN_SIGNUP_CODE from your .env) if
// you need an admin account without this seed script.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function hashed() {
  return bcrypt.hash(DEMO_PASSWORD, 10);
}

async function main() {
  console.log("Seeding PlaySphere database…");
  const pw = await hashed();

  // Clean up existing demo users if re-running seed
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@playsphere.demo" } },
  });

  // ---------------------------------------------------------------------
  // Demo accounts — one per role
  // ---------------------------------------------------------------------
  const player = await prisma.user.upsert({
    where: { email: "player@playsphere.demo" },
    update: {},
    create: {
      name: "Dhruvil Rana",
      email: "player@playsphere.demo",
      passwordHash: pw,
      phone: "+91 98765 43210",
      area: "Satellite, Ahmedabad",
      role: "PLAYER",
      sportsPassportLevel: "Gold",
      matchesPlayed: 47,
      tournamentsWon: 3,
      sportsPref: ["CRICKET", "FOOTBALL"],
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@playsphere.demo" },
    update: {},
    create: {
      name: "Khushil Mehta",
      email: "organizer@playsphere.demo",
      passwordHash: pw,
      phone: "+91 98765 11111",
      area: "Satellite, Ahmedabad",
      role: "ORGANIZER",
      organizationName: "Satellite Sports Club",
    },
  });

  const venueOwner = await prisma.user.upsert({
    where: { email: "venue@playsphere.demo" },
    update: {},
    create: {
      name: "Mahir Shah",
      email: "venue@playsphere.demo",
      passwordHash: pw,
      phone: "+91 98765 22222",
      area: "Satellite, Ahmedabad",
      role: "VENUE_OWNER",
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@playsphere.demo" },
    update: {},
    create: {
      name: "Aryan Patel",
      email: "trainer@playsphere.demo",
      passwordHash: pw,
      phone: "+91 98765 33333",
      area: "SG Highway, Ahmedabad",
      role: "TRAINER",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@playsphere.demo" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@playsphere.demo",
      passwordHash: pw,
      role: "ADMIN",
    },
  });

  // A few extra players used as authors/captains elsewhere in the seed
  const [kavya, rhea, vikram] = await Promise.all([
    prisma.user.upsert({
      where: { email: "kavya@playsphere.demo" },
      update: {},
      create: { name: "Kavya Shah", email: "kavya@playsphere.demo", passwordHash: pw, role: "PLAYER", area: "Prahladnagar" },
    }),
    prisma.user.upsert({
      where: { email: "rhea@playsphere.demo" },
      update: {},
      create: { name: "Rhea Mehta", email: "rhea@playsphere.demo", passwordHash: pw, role: "PLAYER", area: "Vastrapur" },
    }),
    prisma.user.upsert({
      where: { email: "vikram@playsphere.demo" },
      update: {},
      create: { name: "Vikram Solanki", email: "vikram@playsphere.demo", passwordHash: pw, role: "PLAYER", area: "Satellite" },
    }),
  ]);

  console.log("✓ Demo accounts created (password for all: %s)", DEMO_PASSWORD);

  // ---------------------------------------------------------------------
  // Venues (owned by venueOwner)
  // ---------------------------------------------------------------------
  const venueData = [
    { name: "Karnavati Sports Arena", area: "Satellite", sports: ["CRICKET", "FOOTBALL"], pricePerHour: 1200, rating: 4.7, reviews: 214, slotsLeftToday: 3, status: "ACTIVE", bookingsToday: 6, occupancy: 82, revenueThisMonth: 148000 },
    { name: "Karnavati Indoor Courts", area: "Satellite", sports: ["BADMINTON"], pricePerHour: 500, rating: 4.5, reviews: 132, slotsLeftToday: 6, status: "ACTIVE", bookingsToday: 3, occupancy: 54, revenueThisMonth: 62000 },
    { name: "Karnavati Turf Extension", area: "Satellite", sports: ["FOOTBALL"], pricePerHour: 1500, rating: 0, reviews: 0, slotsLeftToday: 0, status: "UNDER_REVIEW", bookingsToday: 0, occupancy: 0, revenueThisMonth: 0 },
  ];
  const venues = [];
  for (const v of venueData) {
    venues.push(
      await prisma.venue.create({
        data: {
          ownerId: venueOwner.id,
          name: v.name,
          area: v.area,
          sports: v.sports as any,
          pricePerHour: v.pricePerHour,
          rating: v.rating,
          reviews: v.reviews,
          image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop",
          slotsLeftToday: v.slotsLeftToday,
          status: v.status as any,
          bookingsToday: v.bookingsToday,
          occupancy: v.occupancy,
          revenueThisMonth: v.revenueThisMonth,
        },
      })
    );
  }

  // A couple more independent active venues for the browse view to feel populated
  const extraVenueOwners = [organizer]; // reuse organizer as a second owner for variety
  const extraVenues = [
    { name: "SG Highway Turf Club", area: "SG Highway", sports: ["FOOTBALL"], pricePerHour: 1500, rating: 4.8, reviews: 301 },
    { name: "Prahladnagar Smash Courts", area: "Prahladnagar", sports: ["BADMINTON", "TABLE_TENNIS"], pricePerHour: 500, rating: 4.5, reviews: 132 },
  ];
  for (const v of extraVenues) {
    await prisma.venue.create({
      data: {
        ownerId: extraVenueOwners[0].id,
        name: v.name,
        area: v.area,
        sports: v.sports as any,
        pricePerHour: v.pricePerHour,
        rating: v.rating,
        reviews: v.reviews,
        image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=800&auto=format&fit=crop",
        slotsLeftToday: 4,
        status: "ACTIVE",
        bookingsToday: 2,
        occupancy: 61,
        revenueThisMonth: 91000,
      },
    });
  }
  console.log("✓ Venues seeded");

  // ---------------------------------------------------------------------
  // Booking requests pending on the venue owner's venues
  // ---------------------------------------------------------------------
  await prisma.booking.createMany({
    data: [
      { venueId: venues[0].id, userId: rhea.id, sport: "CRICKET", slot: "Sun, 7:00-8:00 AM", amount: 1200, status: "PENDING" },
      { venueId: venues[1].id, userId: vikram.id, sport: "BADMINTON", slot: "Sat, 6:00-7:00 PM", amount: 500, status: "PENDING" },
    ],
  });
  console.log("✓ Booking requests seeded");

  // ---------------------------------------------------------------------
  // Tournaments (run by organizer)
  // ---------------------------------------------------------------------
  const tournament1 = await prisma.tournament.create({
    data: {
      organizerId: organizer.id,
      name: "Ahmedabad Premier Box Cricket League",
      sport: "CRICKET",
      format: "Knockout",
      teamsCap: 16,
      entryFee: 3500,
      startDate: new Date("2026-07-18"),
      status: "REGISTRATION_OPEN",
      revenueCollected: 49000,
    },
  });
  const tournament2 = await prisma.tournament.create({
    data: {
      organizerId: organizer.id,
      name: "Satellite Corporate Cricket Cup",
      sport: "CRICKET",
      format: "League + Playoffs",
      teamsCap: 8,
      entryFee: 3500,
      startDate: new Date("2026-06-10"),
      status: "IN_PROGRESS",
      revenueCollected: 28000,
    },
  });
  const publicTournaments = [
    { name: "SG Turf Football Cup", sport: "FOOTBALL", format: "League + Playoffs", teamsCap: 12, entryFee: 5000, startDate: "2026-07-25", status: "REGISTRATION_OPEN" },
    { name: "Prahladnagar Open Badminton Championship", sport: "BADMINTON", format: "Singles Knockout", teamsCap: 64, entryFee: 400, startDate: "2026-07-10", status: "IN_PROGRESS" },
  ];
  for (const t of publicTournaments) {
    await prisma.tournament.create({
      data: {
        organizerId: organizer.id,
        name: t.name,
        sport: t.sport as any,
        format: t.format,
        teamsCap: t.teamsCap,
        entryFee: t.entryFee,
        startDate: new Date(t.startDate),
        status: t.status as any,
      },
    });
  }
  console.log("✓ Tournaments seeded");

  // ---------------------------------------------------------------------
  // Teams + pending registrations for tournament1
  // ---------------------------------------------------------------------
  const teamNames = [
    { name: "Satellite Strikers", captain: player, wins: 9, losses: 3 },
    { name: "Bopal Blazers", captain: kavya, wins: 5, losses: 4 },
    { name: "Naranpura Knights", captain: rhea, wins: 6, losses: 2 },
    { name: "Thaltej Titans", captain: vikram, wins: 4, losses: 5 },
  ];
  const teams = [];
  for (const t of teamNames) {
    teams.push(
      await prisma.team.create({
        data: {
          name: t.name,
          sport: "CRICKET",
          captainId: t.captain.id,
          wins: t.wins,
          losses: t.losses,
          members: { create: [{ userId: t.captain.id, roleName: "Captain" }] },
        },
      })
    );
  }

  await prisma.teamRegistration.create({
    data: { tournamentId: tournament1.id, teamId: teams[0].id, players: 12, status: "APPROVED" },
  });
  await prisma.teamRegistration.create({
    data: { tournamentId: tournament1.id, teamId: teams[1].id, players: 12, status: "PENDING" },
  });
  await prisma.teamRegistration.create({
    data: { tournamentId: tournament1.id, teamId: teams[2].id, players: 11, status: "PENDING" },
  });
  await prisma.teamRegistration.create({
    data: { tournamentId: tournament1.id, teamId: teams[3].id, players: 13, status: "PENDING" },
  });
  console.log("✓ Teams & registrations seeded");

  // ---------------------------------------------------------------------
  // Live matches
  // ---------------------------------------------------------------------
  await prisma.liveMatch.createMany({
    data: [
      { sport: "CRICKET", status: "LIVE", teamA: "Satellite Strikers", teamB: "Bopal Blazers", scoreA: "142/4", scoreB: "-", meta: "Ov 14.2", venueId: venues[0].id },
      { sport: "FOOTBALL", status: "LIVE", teamA: "SG United", teamB: "Vastrapur FC", scoreA: "2", scoreB: "1", meta: "72'" },
      { sport: "BADMINTON", status: "UPCOMING", teamA: "R. Mehta", teamB: "K. Shah", scoreA: "-", scoreB: "-", meta: "6:30 PM", venueId: venues[1].id },
      { sport: "BASKETBALL", status: "FT", teamA: "Naranpura Ballers", teamB: "Chandkheda Kings", scoreA: "58", scoreB: "61", meta: "Final" },
      { sport: "VOLLEYBALL", status: "LIVE", teamA: "Bodakdev Smashers", teamB: "Isanpur Spikers", scoreA: "2", scoreB: "1", meta: "Set 4" },
    ],
  });
  console.log("✓ Live matches seeded");

  // ---------------------------------------------------------------------
  // Community posts
  // ---------------------------------------------------------------------
  await prisma.communityPost.createMany({
    data: [
      { authorId: kavya.id, content: "Looking for 2 more players for a doubles friendly this Saturday morning at Prahladnagar. Intermediate level, 7–9 AM.", sport: "BADMINTON", likes: 24, comments: 9 },
      { authorId: player.id, content: "Won our Premier League opener by 6 wickets! Great chase led by our middle order. Next up: Bopal Blazers on Sunday.", sport: "CRICKET", likes: 118, comments: 21, image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900&auto=format&fit=crop" },
      { authorId: trainer.id, content: "New batch for U-14 footballers starting next Monday at SG Highway Turf Club. Focus on first touch and positional awareness.", sport: "FOOTBALL", likes: 76, comments: 14 },
      { authorId: rhea.id, content: "Anyone up for hitting practice this week at Vastrapur Ace Club? Just moved to intermediate level.", sport: "TENNIS", likes: 12, comments: 5 },
    ],
  });
  console.log("✓ Community posts seeded");

  // ---------------------------------------------------------------------
  // Player requests
  // ---------------------------------------------------------------------
  await prisma.playerRequest.createMany({
    data: [
      { postedById: organizer.id, title: "Weekend 6-a-side football", sport: "FOOTBALL", area: "SG Highway", date: "Sat, 6:00 PM", playersNeeded: 2, level: "INTERMEDIATE" },
      { postedById: kavya.id, title: "Morning badminton doubles", sport: "BADMINTON", area: "Prahladnagar", date: "Sat, 7:00 AM", playersNeeded: 2, level: "INTERMEDIATE" },
      { postedById: player.id, title: "Box cricket, need bowlers", sport: "CRICKET", area: "Bopal", date: "Sun, 9:00 AM", playersNeeded: 3, level: "ADVANCED" },
      { postedById: rhea.id, title: "Casual tennis rally", sport: "TENNIS", area: "Vastrapur", date: "Wed, 6:30 PM", playersNeeded: 1, level: "BEGINNER" },
    ],
  });
  console.log("✓ Player requests seeded");

  // ---------------------------------------------------------------------
  // Trainer profile, batches, students, inquiries (for `trainer` demo user)
  // ---------------------------------------------------------------------
  const trainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: trainer.id,
      sport: "FOOTBALL",
      experience: "8 yrs coaching · Ex-state player",
      rating: 4.9,
      studentCount: 210,
      area: "SG Highway",
      price: "₹800/session",
      tag: "Youth Specialist",
    },
  });

  // A couple of other independent trainers for the public directory
  await prisma.trainerProfile.create({
    data: { userId: kavya.id, sport: "BADMINTON", experience: "AIBA certified · 12 yrs", rating: 4.8, studentCount: 340, area: "Prahladnagar", price: "₹600/session", tag: "Top Rated" },
  });
  await prisma.trainerProfile.create({
    data: { userId: vikram.id, sport: "CRICKET", experience: "Former Ranji trialist · 10 yrs", rating: 4.7, studentCount: 180, area: "Satellite", price: "₹900/session", tag: "Batting Specialist" },
  });

  const batchA = await prisma.trainerBatch.create({
    data: { trainerId: trainerProfile.id, name: "U-14 Evening", time: "5:00 – 6:30 PM", days: "Mon / Wed / Fri", venue: "SG Highway Turf Club" },
  });
  const batchB = await prisma.trainerBatch.create({
    data: { trainerId: trainerProfile.id, name: "U-16 Morning", time: "6:30 – 8:00 AM", days: "Tue / Thu / Sat", venue: "SG Highway Turf Club" },
  });

  await prisma.studentEnrollment.createMany({
    data: [
      { batchId: batchA.id, studentName: "Aarav Shah", attendance: 92, since: "Jan 2026" },
      { batchId: batchA.id, studentName: "Diya Patel", attendance: 88, since: "Feb 2026" },
      { batchId: batchB.id, studentName: "Kabir Mehta", attendance: 95, since: "Nov 2025" },
      { batchId: batchB.id, studentName: "Ishaan Rao", attendance: 79, since: "Mar 2026" },
    ],
  });

  await prisma.inquiry.createMany({
    data: [
      { trainerId: trainerProfile.id, fromId: rhea.id, fromName: rhea.name, message: "Is there a trial session available for my 10-year-old before joining the U-14 batch?" },
      { trainerId: trainerProfile.id, fromId: kavya.id, fromName: kavya.name, message: "What are the fees for the U-16 morning batch and is equipment provided?" },
      { trainerId: trainerProfile.id, fromName: "Meera Iyer", message: "Do you offer one-on-one goalkeeping sessions separately?" },
    ],
  });
  console.log("✓ Trainer, batches, students, inquiries seeded");

  // ---------------------------------------------------------------------
  // Academies
  // ---------------------------------------------------------------------
  await prisma.academy.createMany({
    data: [
      { ownerId: trainer.id, name: "Karnavati Cricket Academy", sports: ["CRICKET"], area: "Satellite", batches: 6, established: "2014", rating: 4.8 },
      { ownerId: trainer.id, name: "Ace Badminton Institute", sports: ["BADMINTON"], area: "Prahladnagar", batches: 4, established: "2018", rating: 4.6 },
      { ownerId: trainer.id, name: "Sabarmati Football School", sports: ["FOOTBALL"], area: "SG Highway", batches: 5, established: "2016", rating: 4.7 },
    ],
  });
  console.log("✓ Academies seeded");

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      { userId: player.id, title: "Booking confirmed", detail: "Karnavati Sports Arena · Sun, 7:00–8:00 AM", type: "BOOKING" },
      { userId: player.id, title: "Fixture published", detail: "Ahmedabad Premier Box Cricket League · Quarterfinal draw is out", type: "TOURNAMENT" },
      { userId: organizer.id, title: "New team registration", detail: "Bopal Blazers registered for Ahmedabad Premier Box Cricket League", type: "TOURNAMENT" },
      { userId: venueOwner.id, title: "New booking request", detail: "Rhea Mehta requested Karnavati Sports Arena", type: "BOOKING" },
    ],
  });
  console.log("✓ Notifications seeded");

  // ---------------------------------------------------------------------
  // Demo Audit Logs — pre-populated so the admin console shows data
  // immediately without needing to perform live actions first
  // ---------------------------------------------------------------------
  const now = new Date();
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);

  await prisma.$executeRaw`
    INSERT INTO "AuditLog" (id, "actorId", "actorRole", category, action, "targetType", "targetId", detail, "createdAt") VALUES
    (gen_random_uuid(), ${player.id},     'PLAYER',      'SECURITY',       'USER_LOGIN_SUCCESS',         'User',          ${player.id},       'IP: 103.21.58.12',                                        ${ago(2)}),
    (gen_random_uuid(), ${player.id},     'PLAYER',      'BOOKING',        'BOOKING_REQUESTED',          'Booking',       ${venues[0].id},    'Sun, 7:00-8:00 AM',                                       ${ago(5)}),
    (gen_random_uuid(), ${player.id},     'PLAYER',      'TOURNAMENT',     'TEAM_REGISTERED',            'Tournament',    ${tournament1.id},  'Satellite Strikers registered',                            ${ago(10)}),
    (gen_random_uuid(), ${player.id},     'PLAYER',      'PLAYER_REQUEST', 'PLAYER_REQUEST_CREATED',     'PlayerRequest', ${player.id},       'Box cricket, need bowlers',                               ${ago(15)}),
    (gen_random_uuid(), ${kavya.id},      'PLAYER',      'PLAYER_REQUEST', 'PLAYER_REQUEST_CREATED',     'PlayerRequest', ${kavya.id},        'Morning badminton doubles',                               ${ago(20)}),
    (gen_random_uuid(), ${rhea.id},       'PLAYER',      'BOOKING',        'BOOKING_REQUESTED',          'Booking',       ${venues[1].id},    'Sat, 6:00-7:00 PM',                                       ${ago(25)}),
    (gen_random_uuid(), ${organizer.id},  'ORGANIZER',   'SECURITY',       'USER_LOGIN_SUCCESS',         'User',          ${organizer.id},    'IP: 103.21.58.44',                                        ${ago(30)}),
    (gen_random_uuid(), ${organizer.id},  'ORGANIZER',   'TOURNAMENT',     'TOURNAMENT_HOSTED',          'Tournament',    ${tournament1.id},  'Ahmedabad Premier Box Cricket League',                    ${ago(35)}),
    (gen_random_uuid(), ${organizer.id},  'ORGANIZER',   'TOURNAMENT',     'TOURNAMENT_HOSTED',          'Tournament',    ${tournament2.id},  'Satellite Corporate Cricket Cup',                         ${ago(40)}),
    (gen_random_uuid(), ${venueOwner.id}, 'VENUE_OWNER', 'SECURITY',       'USER_LOGIN_SUCCESS',         'User',          ${venueOwner.id},   'IP: 103.21.58.77',                                        ${ago(45)}),
    (gen_random_uuid(), ${venueOwner.id}, 'VENUE_OWNER', 'VENUE',          'VENUE_CREATED',              'Venue',         ${venues[0].id},    'Karnavati Sports Arena',                                  ${ago(50)}),
    (gen_random_uuid(), ${venueOwner.id}, 'VENUE_OWNER', 'BOOKING',        'BOOKING_STATUS_CONFIRMED',   'Booking',       ${venues[0].id},    'Sun, 7:00-8:00 AM',                                       ${ago(55)}),
    (gen_random_uuid(), ${venueOwner.id}, 'VENUE_OWNER', 'BOOKING',        'BOOKING_STATUS_CONFIRMED',   'Booking',       ${venues[1].id},    'Sat, 6:00-7:00 PM',                                       ${ago(60)}),
    (gen_random_uuid(), ${trainer.id},    'TRAINER',     'SECURITY',       'USER_LOGIN_SUCCESS',         'User',          ${trainer.id},      'IP: 103.21.58.90',                                        ${ago(65)}),
    (gen_random_uuid(), ${admin.id},      'ADMIN',       'SECURITY',       'USER_LOGIN_SUCCESS',         'User',          ${admin.id},        'IP: 127.0.0.1',                                           ${ago(70)}),
    (gen_random_uuid(), ${admin.id},      'ADMIN',       'ADMIN',          'VENUE_ACTIVATED',            'Venue',         ${venues[0].id},    'Karnavati Sports Arena',                                  ${ago(75)}),
    (gen_random_uuid(), ${admin.id},      'ADMIN',       'ADMIN',          'VENUE_ACTIVATED',            'Venue',         ${venues[1].id},    'Karnavati Indoor Courts',                                 ${ago(80)}),
    (gen_random_uuid(), ${admin.id},      'ADMIN',       'ADMIN',          'TRAINER_ACTIVATED',          'TrainerProfile',${trainer.id},      'Aryan Patel',                                             ${ago(85)}),
    (gen_random_uuid(), ${admin.id},      'ADMIN',       'ADMIN',          'USER_SUSPENDED',             'User',          ${rhea.id},         'Rhea Mehta',                                              ${ago(90)}),
    (gen_random_uuid(), ${admin.id},      'ADMIN',       'ADMIN',          'USER_REACTIVATED',           'User',          ${rhea.id},         'Rhea Mehta',                                              ${ago(95)}),
    (gen_random_uuid(), ${vikram.id},     'PLAYER',      'SECURITY',       'USER_LOGIN_SUCCESS',         'User',          ${vikram.id},       'IP: 103.21.58.20',                                        ${ago(100)}),
    (gen_random_uuid(), ${kavya.id},      'PLAYER',      'BOOKING',        'BOOKING_REQUESTED',          'Booking',       ${venues[0].id},    'Mon, 8:00-9:00 AM',                                       ${ago(120)}),
    (gen_random_uuid(), ${player.id},     'PLAYER',      'BOOKING',        'BOOKING_STATUS_CANCELLED',   'Booking',       ${venues[1].id},    'Fri, 5:00-6:00 PM',                                       ${ago(130)}),
    (gen_random_uuid(), ${organizer.id},  'ORGANIZER',   'PLAYER_REQUEST', 'PLAYER_REQUEST_CREATED',     'PlayerRequest', ${organizer.id},    'Weekend 6-a-side football',                               ${ago(140)})
  `;
  console.log("✓ Demo audit logs seeded");

  console.log("\nSeed complete. Demo logins (password for all: %s):", DEMO_PASSWORD);
  console.log("  player@playsphere.demo     — Player");
  console.log("  organizer@playsphere.demo  — Tournament Organizer");
  console.log("  venue@playsphere.demo      — Venue Owner");
  console.log("  trainer@playsphere.demo    — Trainer / Academy");
  console.log("  admin@playsphere.demo      — Admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
