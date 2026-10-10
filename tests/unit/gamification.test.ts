import { describe, it, expect, vi } from "vitest";

// levelForXp is a pure function, but lib/gamification.ts imports the
// Prisma client at module scope (used by its other exports, awardXp/
// awardBadge, which this file doesn't test). Mocking it here keeps this
// test from needing a real generated Prisma client / database connection
// just to import the module.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { levelForXp } from "@/lib/gamification";

describe("levelForXp", () => {
  it("returns Bronze at 0 XP", () => {
    expect(levelForXp(0)).toBe("Bronze");
  });

  it("returns Bronze just below the Silver threshold", () => {
    expect(levelForXp(149)).toBe("Bronze");
  });

  it("returns Silver exactly at its threshold", () => {
    expect(levelForXp(150)).toBe("Silver");
  });

  it("returns Gold, Platinum, Diamond at their thresholds", () => {
    expect(levelForXp(500)).toBe("Gold");
    expect(levelForXp(1500)).toBe("Platinum");
    expect(levelForXp(4000)).toBe("Diamond");
  });

  it("returns Diamond for any XP beyond the top threshold", () => {
    expect(levelForXp(999_999)).toBe("Diamond");
  });

  it("never returns a level below Bronze for negative input", () => {
    expect(levelForXp(-50)).toBe("Bronze");
  });
});
