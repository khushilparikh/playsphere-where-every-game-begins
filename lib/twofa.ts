// Task 47, Phase 6: TOTP-based two-factor authentication for Admin
// accounts. Uses the `authenticator` API from otplib (pinned to v12 —
// the stable, well-documented API; v13 switched to a lower-level
// functional API this codebase doesn't need). Entirely local — no
// external SMS/email service, works with any standard authenticator app
// (Google Authenticator, Authy, 1Password, etc.) via the standard TOTP
// algorithm.
import { authenticator } from "otplib";

const ISSUER = "PlaySphere";

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export function verifyTotpCode(code: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}
