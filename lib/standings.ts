// Task 18, Phase 5: league/round-robin standings for tournaments with
// bracketType "LEAGUE". Tournament.bracketType already supported this
// value (see prisma/schema.prisma), but nothing computed a table from it
// until now.
//
// Important constraint this works around: LiveMatch.teamA/teamB are
// free-text strings (e.g. typed in by whoever started the match), not a
// foreign key to Team — see prisma/schema.prisma. So a completed match is
// matched back to a registered team by exact (case-insensitive) name, and
// skipped if it doesn't match a team registered for this tournament,
// rather than throwing. This is a pragmatic fit to the existing schema;
// a future migration linking LiveMatch to Team by id would make this
// exact instead of name-matched.
//
// Winner determination is similarly best-effort: scoreA/scoreB are
// sport-specific formatted strings (see lib/sport-scoring.ts, e.g.
// cricket "142/3", tennis "6-4, 3-2"). Comparing the leading number in
// each is correct for goal/point-tally sports (Football, Basketball,
// Volleyball, Badminton, Table Tennis) and a reasonable proxy for others,
// but isn't a true rules-aware result for every sport (e.g. cricket overs
// limits, tennis set-count). Ties fall back to a draw.

export type StandingsRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
};

const POINTS = { win: 3, draw: 1, loss: 0 };

function leadingNumber(score: string): number {
  const m = score.match(/-?\d+/);
  return m ? Number(m[0]) : 0;
}

export function computeStandings(
  registeredTeams: { id: string; name: string }[],
  matches: { teamA: string; teamB: string; scoreA: string; scoreB: string }[]
): StandingsRow[] {
  const byName = new Map(registeredTeams.map((t) => [t.name.trim().toLowerCase(), t]));
  const rows = new Map<string, StandingsRow>(
    registeredTeams.map((t) => [t.id, { teamId: t.id, teamName: t.name, played: 0, won: 0, drawn: 0, lost: 0, points: 0 }])
  );

  for (const m of matches) {
    const teamA = byName.get(m.teamA.trim().toLowerCase());
    const teamB = byName.get(m.teamB.trim().toLowerCase());
    if (!teamA || !teamB || teamA.id === teamB.id) continue; // not a registered-team fixture, skip

    const a = rows.get(teamA.id)!;
    const b = rows.get(teamB.id)!;
    const scoreA = leadingNumber(m.scoreA);
    const scoreB = leadingNumber(m.scoreB);

    a.played += 1;
    b.played += 1;
    if (scoreA > scoreB) {
      a.won += 1;
      a.points += POINTS.win;
      b.lost += 1;
      b.points += POINTS.loss;
    } else if (scoreB > scoreA) {
      b.won += 1;
      b.points += POINTS.win;
      a.lost += 1;
      a.points += POINTS.loss;
    } else {
      a.drawn += 1;
      b.drawn += 1;
      a.points += POINTS.draw;
      b.points += POINTS.draw;
    }
  }

  return Array.from(rows.values()).sort((x, y) => y.points - x.points || y.won - x.won);
}
