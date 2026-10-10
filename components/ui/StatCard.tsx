import { ReactNode } from "react";
import { CountUp } from "@/components/fx/CountUp";

function parseValue(value: string | number) {
  const str = String(value);
  const match = str.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const numeric = match[1].replace(/,/g, "");
  return { end: Number(numeric), suffix: match[2], decimals: numeric.includes(".") ? numeric.split(".")[1].length : 0 };
}

export function StatCard({
  label,
  value,
  icon,
  accent = "volt",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: "volt" | "whistle" | "blue";
}) {
  const accentColor =
    accent === "volt" ? "text-volt" : accent === "whistle" ? "text-whistle" : "text-spark";
  const accentBg =
    accent === "volt" ? "bg-volt/10" : accent === "whistle" ? "bg-whistle/10" : "bg-spark/10";
  const parsed = parseValue(value);

  return (
    <div className="group rounded-2xl border border-court-line bg-court-surface p-5 shadow-card transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          {label}
        </span>
        {icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentBg} ${accentColor} transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl tracking-wide text-ink">
        {parsed ? (
          <CountUp end={parsed.end} suffix={parsed.suffix} decimals={parsed.decimals} duration={1100} />
        ) : (
          value
        )}
      </p>
    </div>
  );
}
