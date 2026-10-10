import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Wrap a Route Handler body in this to get consistent error responses
 * for Zod validation failures and known Prisma errors, instead of a
 * raw 500 with a stack trace leaking to the client.
 *
 *   export async function POST(req: NextRequest) {
 *     return withErrorHandling(async () => { ... });
 *   }
 */
export async function withErrorHandling(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", err.flatten().fieldErrors);
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return badRequest(`A record with this ${err.meta?.target ?? "value"} already exists.`);
      }
      if (err.code === "P2025") {
        return notFound("The record you're trying to update or delete doesn't exist.");
      }
    }
    console.error("Unhandled API error:", err);
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 });
  }
}
