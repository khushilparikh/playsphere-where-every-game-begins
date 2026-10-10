"use client";

import { useState } from "react";
import { MapPin, Users, Calendar, Plus } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useApiGet } from "@/lib/use-api";
import { apiPost, apiPatch } from "@/lib/api-client";
import { useAuth } from "@/components/providers/AuthProvider";
import { sports, type Sport } from "@/lib/mock-data";

const levelTone = { Beginner: "blue", Intermediate: "volt", Advanced: "whistle" } as const;

function JoinRequestModal({ open, onClose, request, onSent }: { open: boolean; onClose: () => void; request: any; onSent: () => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      await apiPost(`/api/player-requests/${request.id}/join`, { message: message.trim() || undefined });
      setMessage("");
      onClose();
      onSent();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="REQUEST TO JOIN" subtitle={request?.title}>
      <p className="text-xs text-ink-faint">Posted by {request?.postedBy}. Add an optional note before sending your request.</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. I play right-back, available all weekend"
        rows={3}
        className="focus-ring mt-3 w-full resize-none rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm placeholder:text-ink-faint"
      />
      <Button className="mt-4 w-full" onClick={send} disabled={sending}>
        {sending ? "Sending…" : "Send request"}
      </Button>
    </Modal>
  );
}

// Task 9, Phase 3: lets the request creator see who asked to join and
// accept/decline each one, instead of join requests just piling up as
// PENDING forever with no resolution.
function ManageJoinRequestsModal({ open, onClose, request, onChanged }: { open: boolean; onClose: () => void; request: any; onChanged: () => void }) {
  const { data, refresh } = useApiGet<{ joinRequests: any[] }>(open && request ? `/api/player-requests/${request.id}/join` : null, [open, request?.id]);
  const joinRequests = data?.joinRequests ?? [];
  const [deciding, setDeciding] = useState<string | null>(null);

  async function decide(joinId: string, status: "ACCEPTED" | "DECLINED") {
    setDeciding(joinId);
    try {
      await apiPatch(`/api/player-requests/${request.id}/join/${joinId}`, { status });
      refresh();
      onChanged();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeciding(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="MANAGE REQUESTS" subtitle={request?.title}>
      <div className="space-y-2">
        {joinRequests.length === 0 && <p className="text-sm text-ink-faint">No one has requested to join yet.</p>}
        {joinRequests.map((j: any) => (
          <div key={j.id} className="rounded-lg border border-court-line px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{j.requesterName}</span>
              {j.status === "PENDING" ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => decide(j.id, "ACCEPTED")}
                    disabled={deciding === j.id}
                    className="focus-ring rounded-lg bg-volt/10 px-2.5 py-1 text-xs font-medium text-volt hover:bg-volt/20"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => decide(j.id, "DECLINED")}
                    disabled={deciding === j.id}
                    className="focus-ring rounded-lg bg-whistle/10 px-2.5 py-1 text-xs font-medium text-whistle hover:bg-whistle/20"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <Badge tone={j.status === "ACCEPTED" ? "volt" : "muted"}>{j.status === "ACCEPTED" ? "Accepted" : "Declined"}</Badge>
              )}
            </div>
            {j.message && <p className="mt-1 text-xs text-ink-faint">&ldquo;{j.message}&rdquo;</p>}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function PlayersPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Sport | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", sport: sports[0], area: "", date: "", playersNeeded: 2, level: "Intermediate" });
  const [joinTarget, setJoinTarget] = useState<any | null>(null);
  const [manageTarget, setManageTarget] = useState<any | null>(null);

  const qs = filter === "All" ? "" : `?sport=${encodeURIComponent(filter)}`;
  const { data, loading, refresh } = useApiGet<{ requests: any[] }>(`/api/player-requests${qs}`, [qs]);
  const requests = data?.requests ?? [];

  async function publish() {
    if (!form.title || !form.area || !form.date) return alert("Title, area and date are required.");
    try {
      await apiPost("/api/player-requests", form);
      setShowForm(false);
      setForm({ title: "", sport: sports[0], area: "", date: "", playersNeeded: 2, level: "Intermediate" });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="pb-16">
      <Topbar title="Player Finder" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-md text-sm text-ink-muted">
            Short of players for your match? Browse open requests below or
            post your own — teammates from your area will see it instantly.
          </p>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Post a request
          </Button>
        </div>

        {showForm && (
          <Card className="mt-6 p-6">
            <h3 className="font-display text-lg tracking-wide">NEW PLAYER REQUEST</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input placeholder="Match title (e.g. Weekend football)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-volt/50" />
              <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value as Sport })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted focus:border-volt/50">
                {sports.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input placeholder="Area (e.g. Satellite)" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-volt/50" />
              <input placeholder="Date & time" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-volt/50" />
              <input type="number" placeholder="Players needed" value={form.playersNeeded} onChange={(e) => setForm({ ...form, playersNeeded: Number(e.target.value) })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-volt/50" />
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted focus:border-volt/50">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <Button className="mt-5" onClick={publish}>Publish request</Button>
          </Card>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <button onClick={() => setFilter("All")} className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium ${filter === "All" ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:text-ink"}`}>All sports</button>
          {sports.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium ${filter === s ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:text-ink"}`}>{s}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {loading && <p className="text-sm text-ink-faint">Loading…</p>}
          {!loading && requests.length === 0 && <p className="text-sm text-ink-faint">No open requests right now.</p>}
          {requests.map((r: any) => (
            <Card key={r.id} hover glow className="p-5">
              <div className="flex items-start justify-between">
                <Badge tone="volt">{r.sport}</Badge>
                <Badge tone={levelTone[r.level as keyof typeof levelTone] ?? "muted"}>{r.level}</Badge>
              </div>
              <h3 className="mt-3 font-display text-base tracking-wide">{r.title.toUpperCase()}</h3>
              <div className="mt-3 space-y-1.5 text-sm text-ink-muted">
                <p className="flex items-center gap-2"><MapPin size={14} className="text-ink-faint" /> {r.area}</p>
                <p className="flex items-center gap-2"><Calendar size={14} className="text-ink-faint" /> {r.date}</p>
                <p className="flex items-center gap-2"><Users size={14} className="text-ink-faint" /> {r.playersNeeded} player{r.playersNeeded > 1 ? "s" : ""} needed</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-court-line pt-4">
                <span className="text-xs text-ink-faint">
                  Posted by {r.postedBy}{r.pendingJoinRequests > 0 ? ` · ${r.pendingJoinRequests} pending` : ""}
                </span>
                {r.postedById === user?.id ? (
                  <Button size="sm" variant="outline" onClick={() => setManageTarget(r)}>
                    Manage requests{r.pendingJoinRequests > 0 ? ` (${r.pendingJoinRequests})` : ""}
                  </Button>
                ) : r.myJoinStatus ? (
                  <Badge tone={r.myJoinStatus === "ACCEPTED" ? "volt" : r.myJoinStatus === "DECLINED" ? "muted" : "whistle"}>
                    {r.myJoinStatus === "PENDING" ? "Requested" : r.myJoinStatus === "ACCEPTED" ? "Accepted" : "Declined"}
                  </Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setJoinTarget(r)}>Request to join</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <JoinRequestModal open={!!joinTarget} onClose={() => setJoinTarget(null)} request={joinTarget} onSent={refresh} />
      <ManageJoinRequestsModal open={!!manageTarget} onClose={() => setManageTarget(null)} request={manageTarget} onChanged={refresh} />
    </div>
  );
}

