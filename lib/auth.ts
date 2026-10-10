import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";
export { AUTH_COOKIE };

export interface AuthTokenPayload {
  userId: string;
  role: string;
  // Task 45, Phase 6: optional for backward compatibility with tokens
  // signed before this field existed — those are treated as version 0,
  // same as every user's default, so existing sessions keep working.
  tokenVersion?: number;
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the auth cookie from an incoming API request,
 * then loads the full user record. Returns null if not authenticated.
 */
export async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status === "SUSPENDED" || user.deletedAt) return null;

  // Task 45, Phase 6: a token signed before a "log out everywhere" action
  // has a stale (lower) tokenVersion and should no longer authenticate.
  if ((payload.tokenVersion ?? 0) !== user.tokenVersion) return null;

  return user;
}

/** Cookie options shared by login/register/demo-login/logout routes */
export function authCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
