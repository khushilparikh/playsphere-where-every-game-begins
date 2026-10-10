import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// High-risk route: captain-only authorization, registration-window and
// capacity-cap enforcement, and duplicate-registration prevention all
// live here.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: vi.fn().mockResolvedValue(1),
    tournament: { findUnique: vi.fn() },
    team: { findUnique: vi.fn() },
    teamRegistration: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/notify", () => ({ notifyUser: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/gamification", () => ({
  awardXp: vi.fn().mockResolvedValue(undefined),
  XP_REWARDS: { TOURNAMENT_REGISTERED: 15 },
}));

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { POST } from "@/app/api/tournaments/[id]/register/route";

const captain = { id: "captain1", name: "Team Captain" };
const otherPlayer = { id: "other1", name: "Not The Captain" };

const openTournament = {
  id: "t1",
  organizerId: "org1",
  name: "Summer Cup",
  status: "REGISTRATION_OPEN",
  teamsCap: 16,
  registrations: [],
};

const team = {
  id: "team1",
  name: "Thunder FC",
  captainId: "captain1",
  _count: { members: 7 },
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tournaments/t1/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/tournaments/:id/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null as any);
    const res = await POST(makeRequest({ teamId: "team1" }), { params: { id: "t1" } });
    expect(res.status).toBe(401);
  });

  it("rejects a body missing teamId", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(captain as any);
    const res = await POST(makeRequest({}), { params: { id: "t1" } });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the tournament doesn't exist", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(captain as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.team.findUnique).mockResolvedValue(team as any);
    const res = await POST(makeRequest({ teamId: "team1" }), { params: { id: "missing" } });
    expect(res.status).toBe(404);
  });

  it("rejects registration from someone who isn't the team captain", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(otherPlayer as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(openTournament as any);
    vi.mocked(prisma.team.findUnique).mockResolvedValue(team as any);

    const res = await POST(makeRequest({ teamId: "team1" }), { params: { id: "t1" } });
    expect(res.status).toBe(403);
    expect(prisma.teamRegistration.create).not.toHaveBeenCalled();
  });

  it("rejects registration once the tournament's registration window is closed", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(captain as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({ ...openTournament, status: "IN_PROGRESS" } as any);
    vi.mocked(prisma.team.findUnique).mockResolvedValue(team as any);

    const res = await POST(makeRequest({ teamId: "team1" }), { params: { id: "t1" } });
    expect(res.status).toBe(409);
  });

  it("rejects registration once the tournament is at capacity", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(captain as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      ...openTournament,
      teamsCap: 5,
      registrations: Array(5).fill({ status: "APPROVED" }),
    } as any);
    vi.mocked(prisma.team.findUnique).mockResolvedValue(team as any);

    const res = await POST(makeRequest({ teamId: "team1" }), { params: { id: "t1" } });
    expect(res.status).toBe(409);
  });

  it("prevents a team from registering twice for the same tournament", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(captain as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(openTournament as any);
    vi.mocked(prisma.team.findUnique).mockResolvedValue(team as any);
    vi.mocked(prisma.teamRegistration.findUnique).mockResolvedValue({ id: "existing-reg" } as any);

    const res = await POST(makeRequest({ teamId: "team1" }), { params: { id: "t1" } });
    expect(res.status).toBe(409);
    expect(prisma.teamRegistration.create).not.toHaveBeenCalled();
  });

  it("registers successfully and defaults players to the team's real roster size", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(captain as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(openTournament as any);
    vi.mocked(prisma.team.findUnique).mockResolvedValue(team as any);
    vi.mocked(prisma.teamRegistration.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.teamRegistration.create).mockResolvedValue({
      id: "reg1",
      tournamentId: "t1",
      teamId: "team1",
      players: 7,
      status: "PENDING",
      team,
      tournament: openTournament,
    } as any);

    const res = await POST(makeRequest({ teamId: "team1" }), { params: { id: "t1" } });
    expect(res.status).toBe(201);
    expect(prisma.teamRegistration.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ players: 7 }) })
    );
  });

  it("respects an explicit players override instead of the roster size", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(captain as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(openTournament as any);
    vi.mocked(prisma.team.findUnique).mockResolvedValue(team as any);
    vi.mocked(prisma.teamRegistration.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.teamRegistration.create).mockResolvedValue({ id: "reg1", team, tournament: openTournament, players: 11, status: "PENDING" } as any);

    await POST(makeRequest({ teamId: "team1", players: 11 }), { params: { id: "t1" } });
    expect(prisma.teamRegistration.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ players: 11 }) })
    );
  });
});
