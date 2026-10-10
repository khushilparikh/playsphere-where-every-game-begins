import { z } from "zod";
import { SPORT_TO_DB } from "@/lib/api-format";

const SPORT_NAMES = Object.keys(SPORT_TO_DB) as [string, ...string[]];

export const createBookingSchema = z.object({
  venueId: z.string().min(1, "venueId is required"),
  slot: z
    .string()
    .trim()
    .min(3, "slot is required")
    .max(80, "slot is too long"),
  sport: z.enum(SPORT_NAMES, { errorMap: () => ({ message: `must be one of: ${SPORT_NAMES.join(", ")}` }) }),
  // Optional override of the venue's listed price. Must be a positive
  // whole number of rupees if provided at all.
  amount: z.number().int().positive().max(1_000_000).optional(),
  // Task 25, Phase 6: recurring bookings. `date`/`time` are only required
  // when `recurrenceWeeks` > 1 (used to compute each week's slot string —
  // see lib/booking-slot.ts); a one-off booking can keep just sending
  // `slot` as before, so this is purely additive to the existing contract.
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD").optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:MM").optional(),
  recurrenceWeeks: z.number().int().min(1).max(12).optional(),
});
