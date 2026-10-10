import { describe, it, expect } from "vitest";
import { registerTeamSchema } from "@/lib/validation/tournament-registration";

describe("registerTeamSchema", () => {
  it("accepts just a teamId", () => {
    expect(registerTeamSchema.safeParse({ teamId: "team1" }).success).toBe(true);
  });

  it("rejects a missing teamId", () => {
    expect(registerTeamSchema.safeParse({}).success).toBe(false);
  });

  it("accepts an optional players override within range", () => {
    expect(registerTeamSchema.safeParse({ teamId: "team1", players: 11 }).success).toBe(true);
  });

  it("rejects a non-positive players count", () => {
    expect(registerTeamSchema.safeParse({ teamId: "team1", players: 0 }).success).toBe(false);
  });

  it("rejects a players count above the 50-player cap", () => {
    expect(registerTeamSchema.safeParse({ teamId: "team1", players: 51 }).success).toBe(false);
  });
});
