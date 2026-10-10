// Task 24, Phase 5: shareable team invite links/QR codes. Uses the same
// JWT secret/library already set up for auth (lib/auth.ts) rather than
// adding a new signing mechanism — a short-lived, single-purpose token
// scoped to "join this team", not an auth token.
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const INVITE_EXPIRES_IN = "7d";

export interface TeamInvitePayload {
  teamId: string;
  purpose: "team-invite";
}

export function signTeamInvite(teamId: string): string {
  const payload: TeamInvitePayload = { teamId, purpose: "team-invite" };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: INVITE_EXPIRES_IN });
}

export function verifyTeamInvite(token: string): TeamInvitePayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TeamInvitePayload;
    if (decoded.purpose !== "team-invite" || !decoded.teamId) return null;
    return decoded;
  } catch {
    return null; // expired or tampered — caller treats this as "invalid link"
  }
}
