import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton pattern: without this, every
// hot-reload of a file that imports `prisma` would open a brand new
// database connection, quickly exhausting Postgres's connection limit.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
