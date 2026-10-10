import { liveMatches } from "@/lib/mock-data";

export function Ticker() {
  const items = [...liveMatches, ...liveMatches];
  return (
    <div className="relative overflow-hidden border-y border-court-line bg-court-surface py-3">
      <div className="mask-fade-x flex w-max animate-ticker gap-10 whitespace-nowrap">
        {items.map((m, i) => (
          <div key={`${m.id}-${i}`} className="flex items-center gap-3 font-mono text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                m.status === "LIVE" ? "animate-pulseDot bg-whistle" : "bg-ink-faint"
              }`}
            />
            <span className="uppercase tracking-widest text-ink-faint">{m.sport}</span>
            <span className="text-ink">
              {m.teamA} <span className="font-semibold text-volt">{m.scoreA}</span>
              {" — "}
              <span className="font-semibold text-volt">{m.scoreB}</span> {m.teamB}
            </span>
            <span className="text-ink-muted">{m.meta}</span>
            <span className="text-court-line">/</span>
          </div>
        ))}
      </div>
    </div>
  );
}
