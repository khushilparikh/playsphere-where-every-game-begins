import { describe, it, expect } from "vitest";
import { computeOpenSlots } from "@/lib/trainer-availability";

// 2026-01-04 is a Sunday (dayOfWeek 0); 2026-01-05 is a Monday (dayOfWeek 1).
describe("computeOpenSlots", () => {
  it("returns hourly slots within a single window", () => {
    const windows = [{ dayOfWeek: 0, startTime: "09:00", endTime: "12:00" }];
    expect(computeOpenSlots(windows, "2026-01-04", [])).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("excludes already-booked slots", () => {
    const windows = [{ dayOfWeek: 0, startTime: "09:00", endTime: "12:00" }];
    expect(computeOpenSlots(windows, "2026-01-04", ["10:00"])).toEqual(["09:00", "11:00"]);
  });

  it("returns nothing for a day with no matching window", () => {
    const windows = [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }]; // Monday only
    expect(computeOpenSlots(windows, "2026-01-04", [])).toEqual([]); // asking about Sunday
  });

  it("combines multiple windows on the same day", () => {
    const windows = [
      { dayOfWeek: 0, startTime: "09:00", endTime: "11:00" },
      { dayOfWeek: 0, startTime: "15:00", endTime: "17:00" },
    ];
    expect(computeOpenSlots(windows, "2026-01-04", [])).toEqual(["09:00", "10:00", "15:00", "16:00"]);
  });

  it("doesn't produce a slot that would run past the window's end time", () => {
    const windows = [{ dayOfWeek: 0, startTime: "09:00", endTime: "09:30" }]; // less than 1hr
    expect(computeOpenSlots(windows, "2026-01-04", [])).toEqual([]);
  });

  it("returns an empty array for a malformed date string", () => {
    expect(computeOpenSlots([{ dayOfWeek: 0, startTime: "09:00", endTime: "12:00" }], "not-a-date", [])).toEqual([]);
  });
});
