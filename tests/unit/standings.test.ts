import { describe, it, expect } from "vitest";
import { computeStandings } from "@/lib/standings";

const teams = [
  { id: "t1", name: "Thunder FC" },
  { id: "t2", name: "Lightning United" },
  { id: "t3", name: "Storm City" },
];

describe("computeStandings", () => {
  it("gives every registered team a zeroed row when no matches have been played", () => {
    const result = computeStandings(teams, []);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });

  it("awards 3 points for a win and 0 for a loss", () => {
    const result = computeStandings(teams, [
      { teamA: "Thunder FC", teamB: "Lightning United", scoreA: "3", scoreB: "1" },
    ]);
    const thunder = result.find((r) => r.teamId === "t1")!;
    const lightning = result.find((r) => r.teamId === "t2")!;
    expect(thunder.won).toBe(1);
    expect(thunder.points).toBe(3);
    expect(lightning.lost).toBe(1);
    expect(lightning.points).toBe(0);
  });

  it("awards 1 point each for a draw", () => {
    const result = computeStandings(teams, [
      { teamA: "Thunder FC", teamB: "Storm City", scoreA: "2", scoreB: "2" },
    ]);
    const thunder = result.find((r) => r.teamId === "t1")!;
    const storm = result.find((r) => r.teamId === "t3")!;
    expect(thunder.drawn).toBe(1);
    expect(thunder.points).toBe(1);
    expect(storm.drawn).toBe(1);
    expect(storm.points).toBe(1);
  });

  it("matches team names case-insensitively", () => {
    const result = computeStandings(teams, [
      { teamA: "thunder fc", teamB: "STORM CITY", scoreA: "1", scoreB: "0" },
    ]);
    expect(result.find((r) => r.teamId === "t1")!.won).toBe(1);
  });

  it("ignores a fixture where a team isn't in the registered list", () => {
    const result = computeStandings(teams, [
      { teamA: "Thunder FC", teamB: "Unregistered Rovers", scoreA: "2", scoreB: "0" },
    ]);
    expect(result.every((r) => r.played === 0)).toBe(true);
  });

  it("sorts by points descending, then by wins as a tiebreaker", () => {
    const result = computeStandings(teams, [
      { teamA: "Thunder FC", teamB: "Lightning United", scoreA: "1", scoreB: "0" },
      { teamA: "Storm City", teamB: "Lightning United", scoreA: "1", scoreB: "0" },
    ]);
    expect(result[0].points).toBeGreaterThanOrEqual(result[1].points);
    expect(result[1].points).toBeGreaterThanOrEqual(result[2].points);
  });

  it("extracts the leading number from a formatted score like cricket's '142/3'", () => {
    const result = computeStandings(teams, [
      { teamA: "Thunder FC", teamB: "Lightning United", scoreA: "142/3", scoreB: "138/9" },
    ]);
    expect(result.find((r) => r.teamId === "t1")!.won).toBe(1);
  });
});
