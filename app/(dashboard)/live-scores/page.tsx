"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, MapPin, MessageSquare, PlayCircle } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useApiGet } from "@/lib/use-api";
import { useLiveMatchSocket } from "@/lib/socket-client";
import { MatchScoringModal } from "@/components/live/MatchScoringModal";

const tabs = ["LIVE", "UPCOMING", "FT"] as const;
const tabLabel: Record<(typeof tabs)[number], string> = { LIVE: "Live now", UPCOMING: "Upcoming", FT: "Completed" };

export default function LiveScoresPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("LIVE");
  const { data, refresh } = useApiGet<{ matches: any[] }>("/api/matches");
  const allMatches = useLiveMatchSocket(data?.matches ?? []);
  const matches = allMatches.filter((m) => m.status === tab);
  const featured = allMatches.find((m) => m.status === "LIVE" && m.sport === "Cricket") ?? allMatches.find((m) => m.status === "LIVE");
  const [commentaryMatch, setCommentaryMatch] = useState<any | null>(null);

  return (
    <div className="pb-16">
      <Topbar title="Live Scores" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex justify-end">
          <Link href="/start-match">
            <Button size="sm"><PlayCircle size={14} /> Start a match</Button>
          </Link>
        </div>

        {featured && (
          <Card dark glow tilt className="mt-4 overflow-hidden p-0 shadow-glow-whistle">
            <div className="flex items-center justify-between bg-white/5 px-6 py-3">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-whistle">
                <span className="h-2 w-2 animate-pulseDot rounded-full bg-whistle" />
                Live · {featured.sport}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <MapPin size={12} /> {featured.venue || "TBD"}
              </span>
            </div>
            <button onClick={() => setCommentaryMatch(featured)} className="focus-ring grid w-full gap-6 p-8 text-left sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="text-center sm:text-right">
                <p className="font-display text-2xl tracking-wide text-white">{featured.teamA.toUpperCase()}</p>
                <p className="mt-2 font-mono text-4xl text-whistle">{featured.scoreA}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-white/40">{featured.meta}</p>
                <p className="mt-2 text-2xl text-white/30">vs</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-whistle"><MessageSquare size={11} /> Scoring & stats</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="font-display text-2xl tracking-wide text-white">{featured.teamB.toUpperCase()}</p>
                <p className="mt-2 font-mono text-4xl text-white/70">{featured.scoreB}</p>
              </div>
            </button>
          </Card>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${tab === t ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:text-ink"}`}>
              {tabLabel[t]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {matches.map((m) => (
            <Card key={m.id} hover className="cursor-pointer p-5" onClick={() => setCommentaryMatch(m)}>
              <div className="flex items-center justify-between">
                <Badge tone={m.status === "LIVE" ? "whistle" : "muted"}>
                  {m.status === "LIVE" && <Radio size={11} />} {m.sport}
                </Badge>
                <span className="text-xs text-ink-faint">{m.meta}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium">{m.teamA}</span>
                <span className="font-mono text-sm text-volt">{m.scoreA}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium">{m.teamB}</span>
                <span className="font-mono text-sm text-ink-muted">{m.scoreB}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-court-line pt-3">
                <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                  <MapPin size={12} /> {m.venue || "TBD"}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-volt"><MessageSquare size={11} /> Scoring & stats</p>
              </div>
            </Card>
          ))}
          {matches.length === 0 && (
            <p className="col-span-2 py-10 text-center text-sm text-ink-faint">
              No {tabLabel[tab].toLowerCase()} matches right now.
            </p>
          )}
        </div>
      </div>

      <MatchScoringModal open={!!commentaryMatch} onClose={() => setCommentaryMatch(null)} match={commentaryMatch} onEnded={refresh} />
    </div>
  );
}
