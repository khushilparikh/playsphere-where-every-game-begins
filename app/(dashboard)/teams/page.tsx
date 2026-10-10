"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Users, Trophy, MessageSquare, Send, UserPlus, CalendarClock, Check, X as XIcon, Image as ImageIcon, Link2, Copy } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QrCode } from "@/components/ui/QrCode";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { sports, type Sport } from "@/lib/mock-data";
import { readAndCompressImage, validateImageFile } from "@/lib/image-compress";

function RosterModal({ open, onClose, team }: { open: boolean; onClose: () => void; team: any }) {
  const { data, refresh } = useApiGet<{ team: any }>(open && team ? `/api/teams/${team.id}` : null, [open, team?.id]);
  const roster = data?.team;
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const { user } = useAuth();
  const isCaptain = roster && user && roster.captainId === user.id;

  // Task 24, Phase 5: shareable invite link + QR code, generated on
  // demand rather than eagerly, so a stale team object doesn't hold onto
  // an unused token.
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setInviteUrl(null);
      setCopied(false);
    }
  }, [open, team?.id]);

  async function generateInvite() {
    setGeneratingInvite(true);
    try {
      const res = await apiPost<{ token: string }>(`/api/teams/${team.id}/invite`, {});
      setInviteUrl(`${window.location.origin}/teams/join/${res.token}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setGeneratingInvite(false);
    }
  }

  function copyInvite() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const ROLE_OPTIONS = ["Player", "Vice-Captain", "Coach", "Substitute"];

  async function invite() {
    if (!email.trim()) return;
    setInviting(true);
    try {
      await apiPost(`/api/teams/${team.id}/members`, { email: email.trim() });
      setEmail("");
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(memberId: string, roleName: string) {
    setSavingRole(memberId);
    try {
      await apiPatch(`/api/teams/${team.id}/members/${memberId}`, { roleName });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingRole(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this player from the team?")) return;
    try {
      await apiDelete(`/api/teams/${team.id}/members/${memberId}`);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="TEAM ROSTER" subtitle={team?.name}>
      <div className="space-y-2">
        {!roster && <p className="text-sm text-ink-faint">Loading…</p>}
        {roster?.members?.map((m: any) => {
          const isTeamCaptain = m.roleName === "Captain";
          return (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-sm">
              <span className="font-medium">{m.name}</span>
              <div className="flex items-center gap-2">
                {isCaptain && !isTeamCaptain ? (
                  <select
                    value={m.roleName}
                    disabled={savingRole === m.id}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    className="focus-ring rounded-lg border border-court-line bg-court px-2 py-1 text-xs"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <Badge tone={isTeamCaptain ? "volt" : "muted"}>{m.roleName}</Badge>
                )}
                {isCaptain && !isTeamCaptain && (
                  <button
                    onClick={() => removeMember(m.id)}
                    aria-label="Remove player"
                    className="focus-ring flex h-6 w-6 items-center justify-center rounded-md text-ink-faint hover:bg-whistle/10 hover:text-whistle"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isCaptain && (
        <div className="mt-5 border-t border-court-line pt-4">
          <p className="mb-2 text-xs text-ink-faint">Add a player by their PlaySphere account email:</p>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@email.com"
              className="focus-ring flex-1 rounded-xl border border-court-line bg-court px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && invite()}
            />
            <Button size="sm" onClick={invite} disabled={inviting}>
              <UserPlus size={14} /> Add
            </Button>
          </div>

          <div className="mt-4 border-t border-court-line pt-4">
            <p className="mb-2 text-xs text-ink-faint">Or share an invite link — anyone with it can join this team:</p>
            {!inviteUrl ? (
              <Button size="sm" variant="outline" onClick={generateInvite} disabled={generatingInvite}>
                <Link2 size={14} /> {generatingInvite ? "Generating…" : "Get invite link"}
              </Button>
            ) : (
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <QrCode value={inviteUrl} size={120} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input readOnly value={inviteUrl} className="focus-ring w-full truncate rounded-lg border border-court-line bg-court px-2.5 py-1.5 text-xs" />
                    <button onClick={copyInvite} aria-label="Copy link" className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-court-line text-ink-faint hover:text-ink">
                      <Copy size={13} />
                    </button>
                  </div>
                  {copied && <p className="mt-1 text-xs text-volt">Copied!</p>}
                  <p className="mt-2 text-[11px] text-ink-faint">Expires in 7 days. Scan the QR code or share the link.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function TeamChatModal({ open, onClose, team }: { open: boolean; onClose: () => void; team: any }) {
  const { data, refresh } = useApiGet<{ messages: any[] }>(open && team ? `/api/teams/${team.id}/messages` : null, [open, team?.id]);
  const messages = data?.messages ?? [];
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Light polling so teammates see new messages without a full page reload.
  useEffect(() => {
    if (!open || !team) return;
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [open, team, refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/teams/${team.id}/messages`, { content: text.trim() });
      setText("");
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  // Task 32, Phase 6: image attachments. Compressed to a data URL and
  // stored directly, matching how this file's own team-logo upload (and
  // community post images) already work — see readAndCompressImage usage
  // elsewhere in this file for the same pattern.
  async function attachImage(file: File) {
    const error = validateImageFile(file);
    if (error) return alert(error);
    setUploading(true);
    try {
      const compressed = await readAndCompressImage(file);
      await apiPost(`/api/teams/${team.id}/messages`, { attachmentUrl: compressed });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="TEAM CHAT" subtitle={team?.name} width="lg">
      <div className="flex h-80 flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-court-line bg-court p-3">
          {messages.length === 0 && <p className="text-center text-xs text-ink-faint">No messages yet — say hello to your team.</p>}
          {messages.map((m: any) => (
            <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${m.senderId === user?.id ? "ml-auto bg-volt text-white" : "bg-court-surface border border-court-line"}`}>
              {m.senderId !== user?.id && <p className="mb-0.5 text-[10px] font-semibold text-volt">{m.senderName}</p>}
              {m.content && <p>{m.content}</p>}
              {m.attachmentUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.attachmentUrl} alt="" className="mt-1 max-h-40 rounded-lg" />
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && attachImage(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Attach image"
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-court-line text-ink-faint hover:text-ink"
          >
            <ImageIcon size={15} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="focus-ring flex-1 rounded-xl border border-court-line bg-court px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button size="sm" onClick={send} disabled={sending}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AttendanceSummary({ teamId }: { teamId: string }) {
  const { data, loading } = useApiGet<{ totalSessions: number; summary: any[] }>(`/api/teams/${teamId}/attendance-summary`);
  const summary = data?.summary ?? [];

  if (loading) return <p className="text-xs text-ink-faint">Loading…</p>;
  if ((data?.totalSessions ?? 0) === 0) return <p className="text-xs text-ink-faint">No sessions logged yet.</p>;

  return (
    <div className="space-y-1.5">
      {summary.map((s: any) => (
        <div key={s.userId} className="flex items-center justify-between text-xs">
          <span className="text-ink-muted">{s.name}</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-court">
              <div className="h-full rounded-full bg-volt" style={{ width: `${s.attendancePct}%` }} />
            </div>
            <span className="w-16 text-right font-medium">{s.sessionsAttended}/{s.totalSessions} ({s.attendancePct}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PracticeModal({ open, onClose, team }: { open: boolean; onClose: () => void; team: any }) {
  const { data, refresh } = useApiGet<{ sessions: any[] }>(open && team ? `/api/teams/${team.id}/practice-sessions` : null, [open, team?.id]);
  const sessions = data?.sessions ?? [];
  const { user } = useAuth();
  const isCaptain = team && user && team.captainId === user.id;
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [form, setForm] = useState({ title: "Practice", date: "", time: "", venue: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // Fix: without this, closing the modal kept `showStats`/`showForm` set
  // from a previous open, and since `team` becomes null on close while
  // the component itself doesn't unmount, the next render tried to read
  // `team.id` on a null team — crashing the whole page (see AttendanceSummary
  // below). Resetting on close/team-change prevents both the crash and
  // stale state leaking into a different team's practice modal.
  useEffect(() => {
    if (!open) {
      setShowStats(false);
      setShowForm(false);
    }
  }, [open, team?.id]);

  async function schedule() {
    if (!form.date || !form.time) return alert("Pick a date and time.");
    setSaving(true);
    try {
      await apiPost(`/api/teams/${team.id}/practice-sessions`, form);
      setForm({ title: "Practice", date: "", time: "", venue: "", notes: "" });
      setShowForm(false);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function markSelf(sessionId: string, present: boolean) {
    try {
      await apiPost(`/api/practice-sessions/${sessionId}/attendance`, { userId: user?.id, present });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="PRACTICE CALENDAR" subtitle={team?.name} width="lg">
      {isCaptain && (
        <div className="mb-4">
          {!showForm ? (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}><Plus size={14} /> Schedule a session</Button>
          ) : (
            <Card className="p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
                <input placeholder="Venue (optional)" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={schedule} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Sessions</p>
        <button onClick={() => setShowStats((s) => !s)} className="focus-ring text-xs font-medium text-volt hover:underline">
          {showStats ? "Hide" : "Show"} attendance stats
        </button>
      </div>
      {showStats && team && (
        <Card className="mb-4 p-4">
          <AttendanceSummary teamId={team.id} />
        </Card>
      )}

      <div className="space-y-2.5">
        {sessions.length === 0 && <p className="text-sm text-ink-faint">No practice sessions scheduled yet.</p>}
        {sessions.map((s: any) => (
          <div key={s.id} className="rounded-xl border border-court-line p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{s.title}</p>
              <span className="text-xs text-ink-faint">{s.presentCount}/{s.attendanceCount} confirmed</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
              <CalendarClock size={12} /> {s.date} · {s.time}{s.venue ? ` · ${s.venue}` : ""}
            </p>
            {s.notes && <p className="mt-1 text-xs text-ink-faint">{s.notes}</p>}
            <div className="mt-2 flex gap-2">
              <button onClick={() => markSelf(s.id, true)} className={`focus-ring flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${s.myAttendance === true ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>
                <Check size={11} /> I&apos;ll be there
              </button>
              <button onClick={() => markSelf(s.id, false)} className={`focus-ring flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${s.myAttendance === false ? "border-whistle bg-whistle/10 text-whistle" : "border-court-line text-ink-muted"}`}>
                <XIcon size={11} /> Can&apos;t make it
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function TeamsPage() {
  const { data, loading, refresh } = useApiGet<{ teams: any[] }>("/api/teams");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", sport: sports[0] as Sport, logoColor: "#FF4757", coachName: "", coachContact: "" });
  const [logo, setLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const teams = data?.teams ?? [];
  const [rosterTeam, setRosterTeam] = useState<any | null>(null);
  const [chatTeam, setChatTeam] = useState<any | null>(null);
  const [practiceTeam, setPracticeTeam] = useState<any | null>(null);

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) return alert(err);
    try {
      setLogo(await readAndCompressImage(file, 400));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function createTeam() {
    if (!form.name) return alert("Team name is required.");
    try {
      await apiPost("/api/teams", { ...form, logo: logo ?? undefined });
      setShowForm(false);
      setForm({ name: "", sport: sports[0], logoColor: "#FF4757", coachName: "", coachContact: "" });
      setLogo(null);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="pb-16">
      <Topbar title="Teams" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-md text-sm text-ink-muted">
            Manage your squads, invite members and track your team&apos;s season record across sports.
          </p>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Create team
          </Button>
        </div>

        {showForm && (
          <Card className="mt-6 p-6">
            <h3 className="font-display text-lg tracking-wide">NEW TEAM</h3>
            <div className="mt-4 flex items-center gap-4">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
              <button type="button" onClick={() => logoInputRef.current?.click()} className="focus-ring flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-court-line bg-court text-ink-faint hover:border-volt/50">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Team logo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={18} />
                )}
              </button>
              <p className="text-xs text-ink-faint">Optional team crest/logo.</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input placeholder="Team name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
              <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value as Sport })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                {sports.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input placeholder="Coach / manager name (optional)" value={form.coachName} onChange={(e) => setForm({ ...form, coachName: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
              <input placeholder="Coach contact (optional)" value={form.coachContact} onChange={(e) => setForm({ ...form, coachContact: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
            </div>
            <Button className="mt-5" onClick={createTeam}>Create team</Button>
          </Card>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-sm text-ink-faint">Loading…</p>}
          {teams.map((t: any) => (
            <Card key={t.id} hover glow className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold" style={{ backgroundColor: `${t.logoColor}22`, color: t.logoColor }}>
                  {t.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    t.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)
                  )}
                </span>
                <div>
                  <Link href={`/teams/${t.id}`} className="hover:underline">
                    <h3 className="font-display text-base tracking-wide">{t.name.toUpperCase()}</h3>
                  </Link>
                  <Badge tone="volt">{t.sport}</Badge>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-court px-2 py-3">
                  <p className="font-display text-lg text-volt">{t.wins}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-faint">Wins</p>
                </div>
                <div className="rounded-lg bg-court px-2 py-3">
                  <p className="font-display text-lg text-whistle">{t.losses}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-faint">Losses</p>
                </div>
                <div className="rounded-lg bg-court px-2 py-3">
                  <p className="font-display text-lg text-ink">{t.members}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-faint">Members</p>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
                <Trophy size={13} className="text-ink-faint" /> Captain: {t.captain}
              </p>
              {t.coachName && (
                <p className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                  <Users size={13} className="text-ink-faint" /> Coach: {t.coachName}{t.coachContact ? ` · ${t.coachContact}` : ""}
                </p>
              )}

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-court-line pt-4">
                <Button size="sm" variant="outline" title="Roster" onClick={() => setRosterTeam(t)}><Users size={14} /></Button>
                <Button size="sm" variant="outline" title="Team chat" onClick={() => setChatTeam(t)}><MessageSquare size={14} /></Button>
                <Button size="sm" variant="outline" title="Practice calendar" onClick={() => setPracticeTeam(t)}><CalendarClock size={14} /></Button>
              </div>
            </Card>
          ))}

          <button onClick={() => setShowForm(true)} className="focus-ring flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-court-line text-ink-faint transition-colors hover:border-volt/50 hover:text-volt">
            <Plus size={22} />
            <span className="text-sm font-medium">Create a new team</span>
          </button>
        </div>
      </div>

      <RosterModal open={!!rosterTeam} onClose={() => setRosterTeam(null)} team={rosterTeam} />
      <TeamChatModal open={!!chatTeam} onClose={() => setChatTeam(null)} team={chatTeam} />
      <PracticeModal open={!!practiceTeam} onClose={() => setPracticeTeam(null)} team={practiceTeam} />
    </div>
  );
}
