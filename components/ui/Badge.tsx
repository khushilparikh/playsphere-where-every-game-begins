import { ReactNode } from "react";

type Tone = "volt" | "whistle" | "blue" | "muted";

const tones: Record<Tone, string> = {
  volt: "bg-volt/15 text-volt border-volt/30",
  whistle: "bg-whistle/15 text-whistle border-whistle/30",
  blue: "bg-spark/10 text-spark border-spark/25",
  muted: "bg-ink/5 text-ink-muted border-court-line",
};

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
