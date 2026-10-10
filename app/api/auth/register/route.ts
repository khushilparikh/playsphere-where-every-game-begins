import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, authCookieOptions, AUTH_COOKIE } from "@/lib/auth";
import { ROLE_TO_DB, SPORT_TO_DB, serializeUser, jsonError, withErrorHandling } from "@/lib/api-format";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const POST = withErrorHandling(async (req: NextRequest) => {
  if (!checkRateLimit(`register:${clientIp(req)}`, 6, 15 * 60 * 1000)) {
    return jsonError("Too many sign-up attempts from this connection. Please wait a while and try again.", 429);
  }

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const {
    name, email, password, phone, area,
    role = "player",
    sportsPref = [],           // player
    organizationName,          // organizer
    venueName, venueSports,    // venue owner
    trainerSport, trainerExperience, // trainer
  } = body;

  if (!name || !email || !password) {
    return jsonError("name, email and password are required");
  }
  if (password.length < 6) {
    return jsonError("Password must be at least 6 characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonError("An account with this email already exists", 409);

  // Admin is a real, explicitly-chosen role — never inferred (e.g. "first
  // user on the DB") — so a normal Player/Organizer/Venue Owner/Trainer
  // signup can never accidentally become an admin account. Creating an
  // admin account requires the ADMIN_SIGNUP_CODE from your .env file.
  if (role === "admin") {
    const requiredCode = process.env.ADMIN_SIGNUP_CODE;
    if (!requiredCode) {
      return jsonError("Admin sign-up is disabled: set ADMIN_SIGNUP_CODE in your .env file first.", 403);
    }
    if (body.adminCode !== requiredCode) {
      return jsonError("Incorrect admin access code.", 403);
    }
  }

  const dbRole = ROLE_TO_DB[role] ?? "PLAYER";
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      area,
      role: dbRole as any,
      organizationName: role === "organizer" ? organizationName : undefined,
      sportsPref: role === "player" ? (sportsPref as string[]).map((s) => SPORT_TO_DB[s] ?? s) as any : [],
    },
  });

  // Role-specific side records
  if (role === "venue" && venueName) {
    await prisma.venue.create({
      data: {
        ownerId: user.id,
        name: venueName,
        area: area || "Ahmedabad",
        sports: [(SPORT_TO_DB[venueSports] ?? "CRICKET")] as any,
        pricePerHour: 800,
        status: "ACTIVE",
      },
    });
  }

  if (role === "trainer" && trainerSport) {
    await prisma.trainerProfile.create({
      data: {
        userId: user.id,
        sport: (SPORT_TO_DB[trainerSport] ?? "FOOTBALL") as any,
        experience: trainerExperience ? `${trainerExperience} yrs coaching` : "New trainer",
        area: area || "Ahmedabad",
        price: "₹600/session",
        tag: "New",
      },
    });
  }

  const token = signToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
  const res = NextResponse.json({ user: serializeUser(user) }, { status: 201 });
  res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  return res;
});
