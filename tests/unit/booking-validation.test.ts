import { describe, it, expect } from "vitest";
import { createBookingSchema } from "@/lib/validation/booking";

describe("createBookingSchema", () => {
  const base = { venueId: "v1", slot: "Sun, 4 Jan, 09:00", sport: "Football" };

  it("accepts a minimal valid booking", () => {
    expect(createBookingSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a missing venueId", () => {
    const { venueId, ...rest } = base;
    expect(createBookingSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an invalid sport", () => {
    expect(createBookingSchema.safeParse({ ...base, sport: "Chess" }).success).toBe(false);
  });

  it("rejects a slot that's too short", () => {
    expect(createBookingSchema.safeParse({ ...base, slot: "a" }).success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(createBookingSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(createBookingSchema.safeParse({ ...base, amount: -100 }).success).toBe(false);
  });

  it("accepts a valid recurring booking with date/time", () => {
    const result = createBookingSchema.safeParse({ ...base, date: "2026-01-04", time: "09:00", recurrenceWeeks: 4 });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed date for a recurring booking", () => {
    const result = createBookingSchema.safeParse({ ...base, date: "04-01-2026", time: "09:00", recurrenceWeeks: 4 });
    expect(result.success).toBe(false);
  });

  it("rejects recurrenceWeeks beyond the 12-week cap", () => {
    const result = createBookingSchema.safeParse({ ...base, date: "2026-01-04", time: "09:00", recurrenceWeeks: 20 });
    expect(result.success).toBe(false);
  });
});
