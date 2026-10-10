// Task 7, Phase 2 — thin adapter between Zod and the route error format the
// rest of the codebase already uses (jsonError -> { error }). Kept
// deliberately small: one helper, called from each route right after
// req.json(), rather than a framework. Roll this out to more routes
// incrementally by adding a schema per input shape in this folder.

import { z } from "zod";
import { jsonError } from "@/lib/api-format";

/**
 * Parses `body` against `schema`. On success returns the typed data.
 * On failure returns a Response (via jsonError) that the caller should
 * immediately `return`.
 *
 *   const parsed = validate(createBookingSchema, body);
 *   if (parsed instanceof Response) return parsed;
 *   // parsed is now fully typed and safe to use
 */
export function validate<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> | Response {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue?.path?.join(".") || "input";
    return jsonError(`Invalid ${field}: ${firstIssue?.message ?? "validation failed"}`);
  }
  return result.data;
}
