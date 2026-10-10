import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

/**
 * Records an admin/security-relevant action. Fire-and-forget by design —
 * a logging failure should never block the action it's logging, so
 * callers don't need to await/try-catch this themselves.
 */
export function logAudit(
  actorId: string | null,
  category: "BOOKING" | "VENUE" | "TOURNAMENT" | "PLAYER_REQUEST" | "INQUIRY" | "SECURITY" | "ADMIN" | "PAYMENT",
  action: string,
  targetType: string,
  targetId: string,
  detail?: string,
  actorRole?: string
) {
  const id = randomUUID();
  // Use $executeRaw to bypass stale Prisma-generated types — the DB columns
  // (actorRole, category) exist after the migration; only the TS typings
  // haven't been refreshed yet (server holds a lock on the DLL on Windows).
  prisma.$executeRaw`
    INSERT INTO "AuditLog" (id, "actorId", "actorRole", category, action, "targetType", "targetId", detail, "createdAt")
    VALUES (${id}, ${actorId}, ${actorRole ?? null}, ${category}, ${action}, ${targetType}, ${targetId}, ${detail ?? null}, NOW())
  `.catch((err) => console.error("Audit log write failed:", err));
}

