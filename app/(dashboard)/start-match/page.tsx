"use client";

import { useState } from "react";
import { PlayCircle, Trophy } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost } from "@/lib/api-client";
import { sports, type Sport } from "@/lib/mock-data";
import { MatchScoringModal } from "@/components/live/MatchScoringModal";

export default function StartMatchPage() {
  const { role } = useAuth();
  const [sport, setSport] = useState<Sport>(sports[0]);
  const [tournamentId, setTournamentId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [starting, setStarting] = useState(false);
  const [activeMatch, setActiveMatch] = useState<any | null>(null);

  // Organizers can pick from their own tournaments to pull in registered teams.
  const { data: tournamentData } = useApiGet<{ tournaments: any[] }>(role === "organizer" ? "/api/tournaments?mine=true" : null);
  const tournaments = tournamentData?.tournaments ?? [];
  const { data: tournamentDetail } = useApiGet<{ registrations: any[] }>(tournamentId ? `/api/tournaments/${tournamentId}` : null, [tournamentId]);
  const approvedTeams = (tournamentDetail?.registrations ?? []).filter((r: any) => r.status === "APPROVED");

  // Venue Owners can tie the match to one of their own venues.
  const { data: venueData } = useApiGet<{ venues: any[] }>(role === "venue" ? "/api/venues?mine=true" : null);
  const venues = venueData?.venues ?? [];

  // Players can quickly pick from teams they belong to.
  const { data: teamData } = useApiGet<{ teams: any[] }>(role === "player" ? "/api/teams" : null);
  const myTeams = teamData?.teams ?? [];

  async function startMatch() {
    if (!teamA.trim() || !teamB.trim()) return alert("Both team names are required.");
    if (teamA.trim() === teamB.trim()) return alert("Team A and Team B must be different.");
    setStarting(true);
    try {
      const res = await apiPost<{ match: any }>("/api/matches", {
        sport,
        teamA: teamA.trim(),
        teamB: teamB.trim(),
        status: "LIVE",
        venueId: venueId || undefined,
        tournamentId: tournamentId || undefined,
        meta: "Just started",
      });
      setActiveMatch(res.match);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="pb-16">
      <Topbar title="Start Match" />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <p className="text-sm text-ink-muted">
          Pick two teams and a sport to start live scoring — ball-by-ball
          commentary, stats and a heatmap all open up right after you start.
        </p>

        <Card className="mt-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">Sport</label>
              <select value={sport} onChange={(e) => setSport(e.target.value as Sport)} className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                {sports.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {role === "organizer" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">Tournament (optional)</label>
                <select value={tournamentId} onChange={(e) => { setTournamentId(e.target.value); setTeamA(""); setTeamB(""); }} className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                  <option value="">None — informal match</option>
                  {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {role === "venue" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">Venue (optional)</label>
                <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                  <option value="">None</option>
                  {venues.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {tournamentId && approvedTeams.length >= 2 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">Team A</label>
                <select value={teamA} onChange={(e) => setTeamA(e.target.value)} className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                  <option value="">Select team</option>
                  {approvedTeams.map((r: any) => <option key={r.id} value={r.team}>{r.team}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">Team B</label>
                <select value={teamB} onChange={(e) => setTeamB(e.target.value)} className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                  <option value="">Select team</option>
                  {approvedTeams.map((r: any) => <option key={r.id} value={r.team}>{r.team}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">Team A</label>
                <input value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="Team or player name" list="my-teams" className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">Team B</label>
                <input value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="Team or player name" list="my-teams" className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
              </div>
              {myTeams.length > 0 && (
                <datalist id="my-teams">
                  {myTeams.map((t: any) => <option key={t.id} value={t.name} />)}
                </datalist>
              )}
            </div>
          )}

          {tournamentId && approvedTeams.length < 2 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-whistle"><Trophy size={12} /> This tournament needs at least 2 approved teams before you can start a match from it.</p>
          )}

          <Button className="mt-6 w-full" onClick={startMatch} disabled={starting}>
            <PlayCircle size={16} /> {starting ? "Starting…" : "Start match & begin scoring"}
          </Button>
        </Card>
      </div>

      <MatchScoringModal open={!!activeMatch} onClose={() => setActiveMatch(null)} match={activeMatch} />
    </div>
  );
}
