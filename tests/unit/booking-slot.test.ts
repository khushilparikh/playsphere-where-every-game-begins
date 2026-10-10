import { describe, it, expect } from "vitest";
import { formatSlot, addWeeksToDate } from "@/lib/booking-slot";

describe("formatSlot", () => {
  it("formats a date + time into the display slot string", () => {
    // 2026-01-04 is a Sunday
    expect(formatSlot("2026-01-04", "14:00")).toBe("Sun, 4 Jan, 14:00");
  });

  it("handles month/year boundaries correctly", () => {
    // 2025-12-31 is a Wednesday
    expect(formatSlot("2025-12-31", "09:30")).toBe("Wed, 31 Dec, 09:30");
  });
});

describe("addWeeksToDate", () => {
  it("adds one week within the same month", () => {
    expect(addWeeksToDate("2026-01-04", 1)).toBe("2026-01-11");
  });

  it("rolls over a month boundary", () => {
    expect(addWeeksToDate("2026-01-28", 1)).toBe("2026-02-04");
  });

  it("rolls over a year boundary", () => {
    expect(addWeeksToDate("2025-12-28", 1)).toBe("2026-01-04");
  });

  it("returns the same date when adding zero weeks", () => {
    expect(addWeeksToDate("2026-03-15", 0)).toBe("2026-03-15");
  });

  it("supports multiple weeks at once (a recurring series)", () => {
    expect(addWeeksToDate("2026-01-04", 4)).toBe("2026-02-01");
  });
});
