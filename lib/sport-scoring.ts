// Drives the sport-specific scoring panel in the Live Scoring module.
// Each sport gets its own set of "quick actions" (the buttons a scorer
// taps) and its own score string format (e.g. cricket "142/3", tennis
// "6-4, 3-2"). Keeping this table-driven means adding a new sport is a
// matter of adding one entry here, not touching the UI component.

export type QuickAction = {
  id: string;
  label: string;
  eventType: string;
  // How this action changes the running score for the acting team.
  // Cricket special-cases wickets/overs; everything else is a simple
  // point/goal delta.
  delta?: number;
  tone?: "volt" | "whistle" | "muted";
};

export const SPORT_ACTIONS: Record<string, QuickAction[]> = {
  Cricket: [
    { id: "0", label: "0", eventType: "RUN", delta: 0 },
    { id: "1", label: "1", eventType: "RUN", delta: 1 },
    { id: "2", label: "2", eventType: "RUN", delta: 2 },
    { id: "3", label: "3", eventType: "RUN", delta: 3 },
    { id: "4", label: "4", eventType: "FOUR", delta: 4, tone: "volt" },
    { id: "6", label: "6", eventType: "SIX", delta: 6, tone: "volt" },
    { id: "wide", label: "Wide", eventType: "EXTRA", delta: 1 },
    { id: "noball", label: "No Ball", eventType: "EXTRA", delta: 1 },
    { id: "wicket", label: "Wicket", eventType: "WICKET", delta: 0, tone: "whistle" },
  ],
  Football: [
    { id: "goal", label: "Goal", eventType: "GOAL", delta: 1, tone: "volt" },
    { id: "yellow", label: "Yellow Card", eventType: "CARD", delta: 0, tone: "whistle" },
    { id: "red", label: "Red Card", eventType: "CARD", delta: 0, tone: "whistle" },
    { id: "corner", label: "Corner", eventType: "CORNER", delta: 0 },
    { id: "foul", label: "Foul", eventType: "FOUL", delta: 0 },
  ],
  Basketball: [
    { id: "1pt", label: "+1 (FT)", eventType: "POINT", delta: 1 },
    { id: "2pt", label: "+2", eventType: "POINT", delta: 2, tone: "volt" },
    { id: "3pt", label: "+3", eventType: "POINT", delta: 3, tone: "volt" },
    { id: "foul", label: "Foul", eventType: "FOUL", delta: 0 },
  ],
  Badminton: [
    { id: "point", label: "Point", eventType: "POINT", delta: 1, tone: "volt" },
    { id: "fault", label: "Fault", eventType: "FAULT", delta: 0 },
    { id: "setwon", label: "Set Won", eventType: "SET", delta: 0, tone: "whistle" },
  ],
  Tennis: [
    { id: "point", label: "Point", eventType: "POINT", delta: 1, tone: "volt" },
    { id: "fault", label: "Fault", eventType: "FAULT", delta: 0 },
    { id: "gamewon", label: "Game Won", eventType: "GAME", delta: 0 },
    { id: "setwon", label: "Set Won", eventType: "SET", delta: 0, tone: "whistle" },
  ],
  "Table Tennis": [
    { id: "point", label: "Point", eventType: "POINT", delta: 1, tone: "volt" },
    { id: "setwon", label: "Set Won", eventType: "SET", delta: 0, tone: "whistle" },
  ],
  Volleyball: [
    { id: "point", label: "Point", eventType: "POINT", delta: 1, tone: "volt" },
    { id: "setwon", label: "Set Won", eventType: "SET", delta: 0, tone: "whistle" },
    { id: "fault", label: "Fault", eventType: "FAULT", delta: 0 },
  ],
};

export function actionsForSport(sport: string): QuickAction[] {
  return SPORT_ACTIONS[sport] ?? SPORT_ACTIONS["Tennis"]; // generic point-based fallback
}

/** Parses a "142/3" cricket score into { runs, wickets }. */
export function parseCricketScore(score: string): { runs: number; wickets: number } {
  const m = score.match(/(-?\d+)\s*\/\s*(\d+)/);
  if (!m) return { runs: 0, wickets: 0 };
  return { runs: Number(m[1]), wickets: Number(m[2]) };
}

/** Applies one quick action to a plain running-total score string. */
export function applyAction(sport: string, currentScore: string, action: QuickAction): string {
  if (sport === "Cricket") {
    const { runs, wickets } = parseCricketScore(currentScore);
    if (action.eventType === "WICKET") return `${runs}/${wickets + 1}`;
    return `${runs + (action.delta ?? 0)}/${wickets}`;
  }
  const current = Number(currentScore) || 0;
  return String(current + (action.delta ?? 0));
}

/**
 * Estimated win probability for Team A, as a percentage 0-100.
 *
 * This is a plain statistical heuristic, NOT a trained model: it combines
 * the current score gap with how far through the match the teams are
 * (using the number of logged events as a rough progress signal) and
 * squashes the result through a sigmoid so a big early lead reads as
 * "likely" rather than "certain", and the estimate sharpens as the match
 * goes on. It's meant to give a reasonable, honest in-app signal — not to
 * be presented as a genuine predictive model.
 */
export function estimateWinProbability(sport: string, scoreA: string, scoreB: string, eventCount: number): number {
  let diff = 0;
  if (sport === "Cricket") {
    const a = parseCricketScore(scoreA);
    const b = parseCricketScore(scoreB);
    diff = (a.runs - b.runs) - (a.wickets - b.wickets) * 4; // losing wickets ~ costs "runs" of momentum
  } else {
    diff = (Number(scoreA) || 0) - (Number(scoreB) || 0);
  }

  // Confidence grows with match progress (more events logged = more signal),
  // capped so early-match estimates stay conservative.
  const progress = Math.min(1, eventCount / 40);
  const sharpness = 0.08 + progress * 0.25;

  const probability = 1 / (1 + Math.exp(-diff * sharpness));
  return Math.round(probability * 100);
}
