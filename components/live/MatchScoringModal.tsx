"use client";

import { useRef, useState } from "react";
import { Send, MapPin, TrendingUp, MessageSquare, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost, apiPatch } from "@/lib/api-client";
import { useMatchEvents } from "@/lib/socket-client";
import { actionsForSport, applyAction, type QuickAction } from "@/lib/sport-scoring";
import { readAndCompressImage, validateImageFile } from "@/lib/image-compress";

type Tab = "score" | "stats" | "heatmap";

function FieldDiagram({ sport, events, pending, onTap }: { sport: string; events: any[]; pending?: { x: number; y: number } | null; onTap?: (x: number, y: number) => void }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const isCircularish = sport === "Badminton" || sport === "Tennis" || sport === "Table Tennis" || sport === "Volleyball" || sport === "Basketball";

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onTap || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onTap(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }

  const points = events.filter((ev: any) => typeof ev.x === "number" && typeof ev.y === "number");

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 60"
      onClick={handleClick}
      className={`w-full rounded-xl border border-court-line bg-gradient-to-b from-volt/5 to-transparent ${onTap ? "cursor-crosshair" : ""}`}
      style={{ aspectRatio: isCircularish ? "1 / 1" : "5 / 3" }}
    >
      <rect x="1" y="1" width="98" height="58" fill="none" stroke="var(--tw-color-court-line, #d8dceb)" strokeWidth="0.6" />
      <line x1="50" y1="1" x2="50" y2="59" stroke="var(--tw-color-court-line, #d8dceb)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
      {points.map((p: any, i: number) => (
        <circle key={p.id ?? i} cx={p.x! * 0.98 + 1} cy={p.y! * 0.58 + 1} r="2.2" fill={p.team === "B" ? "#FFB020" : "#FF4757"} opacity="0.45" />
      ))}
      {pending && <circle cx={pending.x * 0.98 + 1} cy={pending.y * 0.58 + 1} r="2.6" fill="#FFB020" stroke="white" strokeWidth="0.5" />}
    </svg>
  );
}

function StatsTab({ matchId }: { matchId: string }) {
  const { data, loading } = useApiGet<{ stats: any }>(`/api/matches/${matchId}/stats`);
  const stats = data?.stats;

  if (loading || !stats) return <p className="py-6 text-center text-sm text-ink-faint">Loading stats…</p>;

  const maxCount = Math.max(1, ...Object.values(stats.eventTypeCounts as Record<string, number>));

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
          <TrendingUp size={12} /> Estimated win probability
        </p>
        <div className="flex h-6 overflow-hidden rounded-full bg-court">
          <div className="flex items-center justify-center bg-volt text-[10px] font-semibold text-white transition-all" style={{ width: `${stats.winProbability.teamA}%` }}>
            {stats.winProbability.teamA > 12 ? `${stats.winProbability.teamA}%` : ""}
          </div>
          <div className="flex items-center justify-center bg-whistle text-[10px] font-semibold text-white transition-all" style={{ width: `${stats.winProbability.teamB}%` }}>
            {stats.winProbability.teamB > 12 ? `${stats.winProbability.teamB}%` : ""}
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-ink-faint">
          Statistical estimate from the current score gap and match progress — not a trained prediction model.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-faint">Event breakdown ({stats.totalEvents} logged)</p>
        <div className="space-y-1.5">
          {Object.entries(stats.eventTypeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <span className="w-20 shrink-0 text-ink-faint">{type}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-court">
                <div className="h-full rounded-full bg-volt" style={{ width: `${((count as number) / maxCount) * 100}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right font-medium">{count as number}</span>
            </div>
          ))}
          {stats.totalEvents === 0 && <p className="text-xs text-ink-faint">No events logged yet.</p>}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-faint">Team activity share</p>
        <div className="flex h-3 overflow-hidden rounded-full bg-court">
          <div className="bg-volt" style={{ width: `${(stats.teamActivity.teamA / Math.max(1, stats.teamActivity.teamA + stats.teamActivity.teamB)) * 100}%` }} />
          <div className="bg-whistle" style={{ width: `${(stats.teamActivity.teamB / Math.max(1, stats.teamActivity.teamA + stats.teamActivity.teamB)) * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
          <span>Team A · {stats.teamActivity.teamA} events</span>
          <span>Team B · {stats.teamActivity.teamB} events</span>
        </div>
      </div>
    </div>
  );
}

// Task 42, Phase 6: post-match photo upload, shown only once a match's
// status is FT. Follows the codebase's existing convention (see team
// chat attachments, Task 32) of compressing to a data URL client-side
// rather than routing through the /api/uploads endpoint.
function MatchHighlights({ matchId }: { matchId: string }) {
  const { data, refresh } = useApiGet<{ highlights: any[] }>(`/api/matches/${matchId}/highlights`);
  const highlights = data?.highlights ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function addHighlight(file: File) {
    const error = validateImageFile(file);
    if (error) return alert(error);
    setUploading(true);
    try {
      const compressed = await readAndCompressImage(file);
      await apiPost(`/api/matches/${matchId}/highlights`, { image: compressed });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mt-4 border-t border-court-line pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Highlights</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addHighlight(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="focus-ring text-xs font-medium text-volt hover:underline">
          {uploading ? "Uploading…" : "+ Add photo"}
        </button>
      </div>
      {highlights.length === 0 ? (
        <p className="mt-2 text-xs text-ink-faint">No highlights posted yet.</p>
      ) : (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {highlights.map((h: any) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={h.id} src={h.image} alt={h.caption ?? ""} className="h-20 w-20 shrink-0 rounded-lg border border-court-line object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}

export function MatchScoringModal({ open, onClose, match, onEnded }: { open: boolean; onClose: () => void; match: any; onEnded?: () => void }) {
  const { user } = useAuth();
  const canScore = !!user; // any authenticated role may score a match they can see — see Start Match
  const [tab, setTab] = useState<Tab>("score");
  const { data, refresh } = useApiGet<{ events: any[] }>(open && match ? `/api/matches/${match.id}/events` : null, [open, match?.id]);
  const events = useMatchEvents(open ? match?.id ?? null : null, data?.events ?? []);
  const [scoringTeam, setScoringTeam] = useState<"A" | "B">("A");
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [customForm, setCustomForm] = useState({ marker: "", description: "" });
  const [sending, setSending] = useState(false);
  const [scoreA, setScoreA] = useState(match?.scoreA ?? "-");
  const [scoreB, setScoreB] = useState(match?.scoreB ?? "-");

  const actions = actionsForSport(match?.sport ?? "");

  async function logEvent(payload: { marker: string; eventType: string; description: string; scoreA?: string; scoreB?: string; team?: string; x?: number; y?: number }) {
    setSending(true);
    try {
      await apiPost(`/api/matches/${match.id}/events`, payload);
      if (payload.scoreA) setScoreA(payload.scoreA);
      if (payload.scoreB) setScoreB(payload.scoreB);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function tapAction(action: QuickAction) {
    const current = scoringTeam === "A" ? scoreA : scoreB;
    const updated = applyAction(match.sport, current, action);
    const teamName = scoringTeam === "A" ? match.teamA : match.teamB;
    await logEvent({
      marker: `#${events.length + 1}`,
      eventType: action.eventType,
      description: `${action.label} — ${teamName}`,
      team: scoringTeam,
      scoreA: scoringTeam === "A" ? updated : scoreA,
      scoreB: scoringTeam === "B" ? updated : scoreB,
    });
  }

  async function sendCustom() {
    if (!customForm.marker.trim() || !customForm.description.trim()) return alert("Marker and description are required.");
    await logEvent({ marker: customForm.marker, eventType: "NOTE", description: customForm.description, team: scoringTeam });
    setCustomForm({ marker: "", description: "" });
  }

  async function handleFieldTap(x: number, y: number) {
    setPendingPos({ x, y });
    await logEvent({
      marker: `#${events.length + 1}`,
      eventType: "POSITION",
      description: `Position logged for ${scoringTeam === "A" ? match.teamA : match.teamB}`,
      team: scoringTeam,
      x,
      y,
    });
    setPendingPos(null);
  }

  async function endMatch() {
    if (!confirm("Mark this match as finished?")) return;
    try {
      await apiPatch(`/api/matches/${match.id}`, { status: "FT" });
      onEnded?.();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (!match) return null;

  return (
    <Modal open={open} onClose={onClose} title="LIVE SCORING" subtitle={`${match.teamA} vs ${match.teamB} · ${match.sport}`} width="lg">
      <div className="flex items-center justify-between rounded-xl bg-court px-4 py-3">
        <div className="text-center">
          <p className="text-xs font-medium text-ink-muted">{match.teamA}</p>
          <p className="font-mono text-xl text-volt">{scoreA}</p>
        </div>
        <span className="text-xs text-ink-faint">{match.status === "LIVE" ? <span className="flex items-center gap-1 text-whistle"><Radio size={11} /> LIVE</span> : match.status}</span>
        <div className="text-center">
          <p className="text-xs font-medium text-ink-muted">{match.teamB}</p>
          <p className="font-mono text-xl text-ink">{scoreB}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-b border-court-line">
        {([["score", "Score & Commentary", MessageSquare], ["stats", "Stats", TrendingUp], ["heatmap", "Heatmap", MapPin]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`focus-ring -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium ${tab === id ? "border-volt text-volt" : "border-transparent text-ink-muted"}`}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {tab === "score" && (
        <div className="mt-4">
          {canScore && (
            <>
              <div className="mb-3 flex gap-2">
                {(["A", "B"] as const).map((t) => (
                  <button key={t} onClick={() => setScoringTeam(t)} className={`focus-ring flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${scoringTeam === t ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>
                    Scoring for {t === "A" ? match.teamA : match.teamB}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                  <button key={a.id} disabled={sending} onClick={() => tapAction(a)} className={`focus-ring rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${a.tone === "volt" ? "border-volt/40 bg-volt/10 text-volt" : a.tone === "whistle" ? "border-whistle/40 bg-whistle/10 text-whistle" : "border-court-line text-ink-muted hover:text-ink"}`}>
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input placeholder="Marker (optional)" value={customForm.marker} onChange={(e) => setCustomForm({ ...customForm, marker: e.target.value })} className="focus-ring w-28 rounded-lg border border-court-line bg-court px-2.5 py-2 text-xs" />
                <input placeholder="Add a commentary note…" value={customForm.description} onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })} onKeyDown={(e) => e.key === "Enter" && sendCustom()} className="focus-ring flex-1 rounded-lg border border-court-line bg-court px-2.5 py-2 text-xs" />
                <Button size="sm" onClick={sendCustom} disabled={sending}><Send size={12} /></Button>
              </div>

              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" onClick={endMatch}>End match</Button>
              </div>
            </>
          )}

          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto border-t border-court-line pt-3">
            {[...events].reverse().map((e: any) => (
              <div key={e.id} className="flex items-start justify-between rounded-lg border border-court-line px-3 py-2 text-xs">
                <div>
                  <span className="font-mono font-semibold text-volt">{e.marker}</span>{" "}
                  <span className="text-ink-muted">{e.description}</span>
                </div>
                <span className="shrink-0 text-ink-faint">{e.scoreA} — {e.scoreB}</span>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-ink-faint">No commentary yet — the action starts here.</p>}
          </div>

          {match.status === "FT" && <MatchHighlights matchId={match.id} />}
        </div>
      )}

      {tab === "stats" && (
        <div className="mt-4">
          <StatsTab matchId={match.id} />
        </div>
      )}

      {tab === "heatmap" && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-ink-faint">
            {canScore ? "Tap the diagram to log a position for the selected team (e.g. a shot or key play location)." : "Aggregated positions logged during this match."}
          </p>
          {canScore && (
            <div className="mb-3 flex gap-2">
              {(["A", "B"] as const).map((t) => (
                <button key={t} onClick={() => setScoringTeam(t)} className={`focus-ring flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${scoringTeam === t ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>
                  {t === "A" ? match.teamA : match.teamB}
                </button>
              ))}
            </div>
          )}
          <FieldDiagram sport={match.sport} events={events} pending={pendingPos} onTap={canScore ? handleFieldTap : undefined} />
          <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-faint">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-volt" /> {match.teamA}</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-whistle" /> {match.teamB}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
