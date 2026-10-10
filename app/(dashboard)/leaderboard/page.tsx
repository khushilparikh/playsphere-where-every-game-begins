"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Flame, MapPin, Medal, ChevronDown } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useApiGet } from "@/lib/use-api";
import { useAuth } from "@/components/providers/AuthProvider";
import { sports } from "@/lib/mock-data";

const levelTone: Record<string, "volt" | "whistle" | "blue" | "muted"> = {
  Bronze: "muted",
  Silver: "blue",
  Gold: "whistle",
  Platinum: "volt",
  Diamond: "volt",
};

const medalColor = ["#D4AF37", "#B8C0CC", "#B5651D"]; // gold, silver, bronze

// Task 12, Phase 3: transparent XP rules, pulled from the real
// thresholds/rewards the backend uses (GET /api/gamification/rules) so
// this can never drift out of sync with what awardXp() actually does.
function XpRulesPanel() {
  const [open, setOpen] = useState(false);
  const { data } = useApiGet<{ levels: { xp: number; label: string }[]; actions: { label: string; xp: number }[] }>(
    open ? "/api/gamification/rules" : null
  );

  return (
    <Card className="mt-4 p-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-medium"
      >
        How does XP work?
        <ChevronDown size={16} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-6 border-t border-court-line px-5 py-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">Sports Passport tiers</p>
            <div className="mt-2 space-y-1.5">
              {(data?.levels ?? []).map((l) => (
                <div key={l.label} className="flex items-center justify-between text-sm">
                  <Badge tone={levelTone[l.label] ?? "muted"}>{l.label}</Badge>
                  <span className="text-ink-faint">{l.xp}+ XP</span>
                </div>
              ))}
              {!data && <p className="text-xs text-ink-faint">Loading…</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">Ways to earn XP</p>
            <div className="mt-2 space-y-1.5">
              {(data?.actions ?? []).map((a) => (
                <div key={a.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{a.label}</span>
                  <span className="font-medium text-volt">+{a.xp} XP</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">Plus one-off badges (e.g. your first booking, first team, tournament wins) for bonus XP.</p>
          </div>
        </div>
      )}
    </Card>
  );
}

// Task 44, Phase 6: browses past-season final standings, saved by
// scripts/snapshot-season.ts. Hidden entirely if no seasons have been
// closed yet, rather than showing an empty "Hall of Fame" section.
function HallOfFamePanel() {
  const { data: seasonsData } = useApiGet<{ seasons: string[] }>("/api/leaderboard/hall-of-fame");
  const seasons = seasonsData?.seasons ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const { data: standingsData } = useApiGet<{ standings: any[] }>(
    selected ? `/api/leaderboard/hall-of-fame?season=${encodeURIComponent(selected)}` : null,
    [selected]
  );

  if (seasons.length === 0) return null;

  return (
    <Card className="mt-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
          <Medal size={13} /> Hall of Fame
        </h3>
        <select value={selected ?? ""} onChange={(e) => setSelected(e.target.value || null)} className="focus-ring rounded-lg border border-court-line bg-court px-2.5 py-1.5 text-xs">
          <option value="">Select a season…</option>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {selected && (
        <div className="mt-3 space-y-1.5">
          {(standingsData?.standings ?? []).slice(0, 10).map((s: any) => (
            <div key={s.userId} className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">#{s.rank} {s.name}</span>
              <span className="font-medium text-volt">{s.xp} XP · {s.level}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sportFilter, setSportFilter] = useState<string>("All");
  const { data, loading } = useApiGet<{ leaderboard: any[] }>(
    `/api/leaderboard${sportFilter !== "All" ? `?sport=${encodeURIComponent(sportFilter)}` : ""}`,
    [sportFilter]
  );
  const list = data?.leaderboard ?? [];
  const myRank = list.find((l: any) => l.id === user?.id);

  return (
    <div className="pb-16">
      <Topbar title="Leaderboard" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-sm text-ink-muted">
          Earn XP by playing matches, booking venues, joining tournaments and being active in the community — climb the ranks and level up your Sports Passport.
        </p>

        <XpRulesPanel />

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-ink-faint">Sport:</span>
          <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="focus-ring rounded-lg border border-court-line bg-court px-2.5 py-1.5 text-xs text-ink-muted">
            <option value="All">All sports</option>
            {sports.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {myRank && (
          <Card className="mt-6 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-volt/15 font-display text-sm text-volt">#{myRank.rank}</span>
              <div>
                <p className="text-sm font-semibold">Your rank</p>
                <p className="text-xs text-ink-faint">{myRank.xp} XP · {myRank.badgeCount} badges</p>
              </div>
            </div>
            <Badge tone={levelTone[myRank.level] ?? "muted"}>{myRank.level}</Badge>
          </Card>
        )}

        <div className="mt-6 space-y-2.5">
          {loading && <p className="text-sm text-ink-faint">Loading leaderboard…</p>}
          {!loading && list.length === 0 && <p className="text-sm text-ink-faint">No ranked players yet — be the first to earn XP!</p>}
          {list.map((p: any) => (
            <Card key={p.id} hover className={`flex cursor-pointer items-center justify-between p-4 ${p.id === user?.id ? "border-volt/50" : ""}`} onClick={() => router.push(`/players/${p.id}`)}>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm"
                  style={{
                    color: p.rank <= 3 ? medalColor[p.rank - 1] : undefined,
                    backgroundColor: p.rank <= 3 ? `${medalColor[p.rank - 1]}22` : "var(--tw-color-court, #f2f4fa)",
                  }}
                >
                  {p.rank <= 3 ? <Medal size={16} /> : `#${p.rank}`}
                </span>
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-volt/15 text-xs font-bold text-volt">
                  {p.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (p.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-ink-faint"><MapPin size={10} /> {p.area || "Ahmedabad"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><Flame size={13} className="text-whistle" /> {p.matchesPlayed}</span>
                <span className="flex items-center gap-1"><Trophy size={13} className="text-volt" /> {p.tournamentsWon}</span>
                <Badge tone={levelTone[p.level] ?? "muted"}>{p.xp} XP</Badge>
              </div>
            </Card>
          ))}
        </div>

        <HallOfFamePanel />
      </div>
    </div>
  );
}
