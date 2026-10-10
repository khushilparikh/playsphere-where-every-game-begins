"use client";

import { useRef, useState } from "react";
import { Plus, Users, Wallet, CalendarDays, CheckCircle2, XCircle, ListChecks, Handshake, BarChart3 } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost, apiPatch } from "@/lib/api-client";
import { sports, type Sport } from "@/lib/mock-data";
import { readAndCompressImage, validateImageFile } from "@/lib/image-compress";
import { DemoPaymentModal } from "@/components/payments/DemoPaymentModal";

const statusTone: Record<string, "volt" | "whistle" | "muted"> = {
  "Registration Open": "volt",
  "In Progress": "whistle",
  Completed: "muted",
};
const tabs = ["All", "Registration Open", "In Progress", "Completed"] as const;

function ManageTournamentsView() {
  const { data, loading, refresh } = useApiGet<{ tournaments: any[] }>("/api/tournaments?mine=true");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", sport: sports[0], teamsCap: 16, entryFee: 2000, startDate: "" });
  const tournaments = data?.tournaments ?? [];

  async function createTournament() {
    if (!form.name || !form.startDate) return alert("Name and start date are required.");
    try {
      await apiPost("/api/tournaments", form);
      setShowForm(false);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-md text-sm text-ink-muted">
          Manage the tournaments you&apos;ve created — approve team
          registrations, generate fixtures and publish results.
        </p>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Create tournament
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6 p-6">
          <h3 className="font-display text-lg tracking-wide">NEW TOURNAMENT</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input placeholder="Tournament name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
            <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value as Sport })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
              {sports.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input type="number" placeholder="Teams cap" value={form.teamsCap} onChange={(e) => setForm({ ...form, teamsCap: Number(e.target.value) })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
            <input type="number" placeholder="Entry fee (₹)" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: Number(e.target.value) })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm sm:col-span-2" />
          </div>
          <Button className="mt-5" onClick={createTournament}>Create</Button>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {loading && <p className="text-sm text-ink-faint">Loading…</p>}
          {!loading && tournaments.length === 0 && (
            <p className="text-sm text-ink-faint">You haven&apos;t created any tournaments yet.</p>
          )}
          {tournaments.map((t) => (
            <TournamentManageCard key={t.id} tournament={t} onChange={refresh} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Task 55, Phase 6: registrations-over-time for the organizer — see
// GET /api/tournaments/:id/analytics.
function TournamentAnalyticsPanel({ tournamentId }: { tournamentId: string }) {
  const { data } = useApiGet<{ series: any[]; totalRegistrations: number; approved: number; pending: number; rejected: number; revenueCollected: number }>(
    `/api/tournaments/${tournamentId}/analytics`
  );
  const series = data?.series ?? [];
  const maxCount = Math.max(1, ...series.map((s: any) => s.count));

  return (
    <div className="mt-4 border-t border-court-line pt-4">
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div><p className="font-display text-lg text-volt">{data?.totalRegistrations ?? 0}</p><p className="text-ink-faint">Total</p></div>
        <div><p className="font-display text-lg text-volt">{data?.approved ?? 0}</p><p className="text-ink-faint">Approved</p></div>
        <div><p className="font-display text-lg text-whistle">{data?.pending ?? 0}</p><p className="text-ink-faint">Pending</p></div>
        <div><p className="font-display text-lg">₹{((data?.revenueCollected ?? 0) / 1000).toFixed(0)}k</p><p className="text-ink-faint">Revenue</p></div>
      </div>
      {series.length > 0 ? (
        <div className="mt-3 flex items-end gap-1" style={{ height: 56 }}>
          {series.map((s: any) => (
            <div key={s.date} className="group relative flex-1">
              <div className="rounded-t bg-volt/70 transition-colors group-hover:bg-volt" style={{ height: `${Math.max(4, (s.count / maxCount) * 56)}px` }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] text-court group-hover:block">
                {s.date}: {s.count}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-faint">No registrations yet.</p>
      )}
    </div>
  );
}

function TournamentManageCard({ tournament, onChange }: { tournament: any; onChange: () => void }) {
  const { data, refresh: refreshDetail } = useApiGet<{ registrations: any[] }>(`/api/tournaments/${tournament.id}`);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showFixtures, setShowFixtures] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const registrations = data?.registrations ?? [];
  const pending = registrations.filter((r: any) => r.status === "PENDING");
  const approved = registrations.filter((r: any) => r.status === "APPROVED");
  const pct = Math.round((tournament.teamsRegistered / tournament.teamsCap) * 100);

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    if (busyId) return; // guards against a double-click firing two requests
    setBusyId(id);
    try {
      await apiPatch(`/api/registrations/${id}`, { status });
      refreshDetail();
      onChange();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card hover glow className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="volt">{tournament.sport}</Badge>
        <Badge tone={tournament.status === "Registration Open" ? "volt" : "muted"}>{tournament.status}</Badge>
        {pending.length > 0 && <Badge tone="whistle">{pending.length} pending approval</Badge>}
      </div>
      <h3 className="mt-3 font-display text-lg tracking-wide">{tournament.name.toUpperCase()}</h3>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
        <span className="flex items-center gap-1.5"><Users size={14} className="text-ink-faint" /> {tournament.teamsRegistered}/{tournament.teamsCap} teams</span>
        <span className="flex items-center gap-1.5"><Wallet size={14} className="text-ink-faint" /> ₹{(tournament.revenueCollected ?? 0).toLocaleString("en-IN")} collected</span>
      </div>
      <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-court">
        <div className="h-full rounded-full bg-gradient-to-r from-volt to-volt/70 transition-[width] duration-1000 ease-spring" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 flex gap-2 border-t border-court-line pt-4">
        {tournament.bracketType === "LEAGUE" ? (
          <Button size="sm" variant="outline" onClick={() => setShowStandings(true)}>
            <ListChecks size={14} /> Standings
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowFixtures(true)}>
            <ListChecks size={14} /> Fixtures
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setShowExtras(true)}>
          <Handshake size={14} /> Sponsors & Gallery
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowAnalytics((s) => !s)}>
          <BarChart3 size={14} /> Analytics
        </Button>
      </div>

      {showAnalytics && <TournamentAnalyticsPanel tournamentId={tournament.id} />}

      {pending.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-court-line pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Pending approval</p>
          {pending.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-court px-3 py-2">
              <span className="text-xs font-medium">{p.team} · {p.players} players</span>
              <div className="flex gap-1.5">
                <button disabled={busyId === p.id} onClick={() => decide(p.id, "APPROVED")} className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-volt/10 text-volt hover:bg-volt/20 disabled:opacity-40">
                  <CheckCircle2 size={13} />
                </button>
                <button disabled={busyId === p.id} onClick={() => decide(p.id, "REJECTED")} className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-whistle/10 text-whistle hover:bg-whistle/20 disabled:opacity-40">
                  <XCircle size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-court-line pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Registered teams ({approved.length})</p>
        {approved.length === 0 && <p className="text-xs text-ink-faint">No teams approved yet.</p>}
        {approved.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg bg-court px-3 py-2 text-xs">
            <span className="font-medium">{r.team}</span>
            <span className="text-ink-faint">{r.players} players</span>
          </div>
        ))}
      </div>

      <FixturesModal open={showFixtures} onClose={() => setShowFixtures(false)} tournamentId={tournament.id} tournamentName={tournament.name} />
      <StandingsModal open={showStandings} onClose={() => setShowStandings(false)} tournamentId={tournament.id} tournamentName={tournament.name} />
      <TournamentExtrasModal open={showExtras} onClose={() => setShowExtras(false)} tournamentId={tournament.id} tournamentName={tournament.name} />
    </Card>
  );
}

function TournamentExtrasModal({ open, onClose, tournamentId, tournamentName }: { open: boolean; onClose: () => void; tournamentId: string; tournamentName: string }) {
  const [tab, setTab] = useState<"sponsors" | "officials" | "gallery">("sponsors");
  const { data: sponsorData, refresh: refreshSponsors } = useApiGet<{ sponsors: any[] }>(open ? `/api/tournaments/${tournamentId}/sponsors` : null, [open, tab]);
  const { data: officialData, refresh: refreshOfficials } = useApiGet<{ officials: any[] }>(open ? `/api/tournaments/${tournamentId}/officials` : null, [open, tab]);
  const { data: galleryData, refresh: refreshGallery } = useApiGet<{ images: any[] }>(open ? `/api/tournaments/${tournamentId}/gallery` : null, [open, tab]);

  const [sponsorForm, setSponsorForm] = useState({ name: "", tier: "Gold" });
  const [officialForm, setOfficialForm] = useState({ name: "", role: "Umpire", contact: "" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);

  async function addSponsor() {
    if (!sponsorForm.name.trim()) return;
    setSaving(true);
    try {
      await apiPost(`/api/tournaments/${tournamentId}/sponsors`, sponsorForm);
      setSponsorForm({ name: "", tier: "Gold" });
      refreshSponsors();
    } catch (e) { alert((e as Error).message); } finally { setSaving(false); }
  }

  async function addOfficial() {
    if (!officialForm.name.trim()) return;
    setSaving(true);
    try {
      await apiPost(`/api/tournaments/${tournamentId}/officials`, officialForm);
      setOfficialForm({ name: "", role: "Umpire", contact: "" });
      refreshOfficials();
    } catch (e) { alert((e as Error).message); } finally { setSaving(false); }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) return alert(err);
    try {
      setImagePreview(await readAndCompressImage(file));
    } catch (err) { alert((err as Error).message); }
  }

  async function addImage() {
    if (!imagePreview) return;
    setSaving(true);
    try {
      await apiPost(`/api/tournaments/${tournamentId}/gallery`, { image: imagePreview });
      setImagePreview(null);
      refreshGallery();
    } catch (e) { alert((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="TOURNAMENT EXTRAS" subtitle={tournamentName} width="lg">
      <div className="flex gap-2 border-b border-court-line">
        {(["sponsors", "officials", "gallery"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`focus-ring -mb-px border-b-2 px-3 py-2 text-xs font-medium capitalize ${tab === t ? "border-volt text-volt" : "border-transparent text-ink-muted"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "sponsors" && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input placeholder="Sponsor name" value={sponsorForm.name} onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })} className="focus-ring flex-1 rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
            <select value={sponsorForm.tier} onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm text-ink-muted">
              <option>Title</option><option>Gold</option><option>Silver</option><option>Bronze</option>
            </select>
            <Button size="sm" onClick={addSponsor} disabled={saving}><Plus size={14} /></Button>
          </div>
          <div className="space-y-1.5">
            {(sponsorData?.sponsors ?? []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-court px-3 py-2 text-xs">
                <span className="font-medium">{s.name}</span>
                <Badge tone="muted">{s.tier}</Badge>
              </div>
            ))}
            {(sponsorData?.sponsors ?? []).length === 0 && <p className="text-xs text-ink-faint">No sponsors added yet.</p>}
          </div>
        </div>
      )}

      {tab === "officials" && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input placeholder="Name" value={officialForm.name} onChange={(e) => setOfficialForm({ ...officialForm, name: e.target.value })} className="focus-ring flex-1 rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
            <select value={officialForm.role} onChange={(e) => setOfficialForm({ ...officialForm, role: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm text-ink-muted">
              <option>Umpire</option><option>Referee</option><option>Scorer</option><option>Match Commissioner</option>
            </select>
            <Button size="sm" onClick={addOfficial} disabled={saving}><Plus size={14} /></Button>
          </div>
          <div className="space-y-1.5">
            {(officialData?.officials ?? []).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg bg-court px-3 py-2 text-xs">
                <span className="font-medium">{o.name}</span>
                <span className="text-ink-faint">{o.role}</span>
              </div>
            ))}
            {(officialData?.officials ?? []).length === 0 && <p className="text-xs text-ink-faint">No officials added yet.</p>}
          </div>
        </div>
      )}

      {tab === "gallery" && (
        <div className="mt-4 space-y-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Choose photo</Button>
            {imagePreview && <Button size="sm" onClick={addImage} disabled={saving}>Add to gallery</Button>}
          </div>
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="h-24 rounded-lg border border-court-line object-cover" />
          )}
          <div className="grid grid-cols-3 gap-2">
            {(galleryData?.images ?? []).map((img: any) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.image} alt={img.caption ?? ""} className="h-20 w-full rounded-lg border border-court-line object-cover" />
            ))}
          </div>
          {(galleryData?.images ?? []).length === 0 && <p className="text-xs text-ink-faint">No photos yet.</p>}
        </div>
      )}
    </Modal>
  );
}

function FixturesModal({ open, onClose, tournamentId, tournamentName }: { open: boolean; onClose: () => void; tournamentId: string; tournamentName: string }) {
  const { data, loading } = useApiGet<{ teams: number; rounds: any[]; message?: string }>(open ? `/api/tournaments/${tournamentId}/fixtures` : null, [open]);

  return (
    <Modal open={open} onClose={onClose} title="FIXTURES" subtitle={tournamentName} width="lg">
      {loading && <p className="text-sm text-ink-faint">Loading fixtures…</p>}
      {!loading && data?.message && <p className="text-sm text-ink-faint">{data.message}</p>}
      {!loading && data?.rounds && data.rounds.length > 0 && (
        <div className="space-y-5">
          {data.rounds.map((round: any, i: number) => (
            <div key={i}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-volt">{round.name}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {round.matches.map((m: any, j: number) => (
                  <div key={j} className="flex items-center justify-between rounded-lg border border-court-line bg-court px-3 py-2.5 text-xs">
                    <span className="font-medium">{m.a?.name ?? "TBD"}</span>
                    <span className="text-ink-faint">vs</span>
                    <span className="font-medium">{m.b?.name ?? (m.tbd ? "TBD" : "BYE")}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function StandingsModal({ open, onClose, tournamentId, tournamentName }: { open: boolean; onClose: () => void; tournamentId: string; tournamentName: string }) {
  const { data, loading } = useApiGet<{ standings: any[] }>(open ? `/api/tournaments/${tournamentId}/standings` : null, [open]);
  const standings = data?.standings ?? [];

  return (
    <Modal open={open} onClose={onClose} title="STANDINGS" subtitle={tournamentName} width="lg">
      {loading && <p className="text-sm text-ink-faint">Loading standings…</p>}
      {!loading && standings.length === 0 && <p className="text-sm text-ink-faint">No approved teams yet.</p>}
      {!loading && standings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-ink-faint">
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">Team</th>
                <th className="pb-2 pr-3 text-center font-medium">P</th>
                <th className="pb-2 pr-3 text-center font-medium">W</th>
                <th className="pb-2 pr-3 text-center font-medium">D</th>
                <th className="pb-2 pr-3 text-center font-medium">L</th>
                <th className="pb-2 text-center font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s: any, i: number) => (
                <tr key={s.teamId} className="border-t border-court-line">
                  <td className="py-2 pr-3 text-ink-faint">{i + 1}</td>
                  <td className="py-2 pr-3 font-medium">{s.teamName}</td>
                  <td className="py-2 pr-3 text-center">{s.played}</td>
                  <td className="py-2 pr-3 text-center">{s.won}</td>
                  <td className="py-2 pr-3 text-center">{s.drawn}</td>
                  <td className="py-2 pr-3 text-center">{s.lost}</td>
                  <td className="py-2 text-center font-semibold text-volt">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

function RegisterTeamModal({ open, onClose, tournament, onRegistered }: { open: boolean; onClose: () => void; tournament: any; onRegistered: () => void }) {
  const isOpen = tournament?.status === "Registration Open";
  // Fetched whenever the modal is open — not just for registration
  // (isOpen), since the "Completed" branch below also needs the viewer's
  // teams to build certificate download links (Task 31).
  const { data } = useApiGet<{ teams: any[] }>(open ? "/api/teams" : null, [open]);
  const teams = (data?.teams ?? []).filter((t: any) => t.sport === tournament?.sport);
  const [teamId, setTeamId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Payment Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSession, setPaymentSession] = useState<any>(null);

  async function submit() {
    if (!teamId) return alert("Select a team first.");
    setSubmitting(true);
    try {
      const res = await apiPost<{ registration?: any }>(`/api/tournaments/${tournament.id}/register`, { teamId });
      
      const regId = res.registration?.id || (res as any).id;
      
      if (regId && tournament.entryFee && tournament.entryFee > 0) {
        const payRes = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetType: "TOURNAMENT",
            targetId: regId,
            amount: tournament.entryFee,
            method: "CARD"
          })
        });
        
        const payData = await payRes.json();
        if (payData.success) {
          setPaymentSession(payData);
          setShowPayment(true);
          return; // Wait for modal to finish
        }
      }
      
      onClose();
      onRegistered();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <Modal open={open} onClose={onClose} title="TOURNAMENT DETAILS" subtitle={tournament?.name}>
        <div className="space-y-2 text-sm text-ink-muted">
          <p>Sport: <span className="text-ink">{tournament?.sport}</span></p>
          <p>Format: <span className="text-ink">{tournament?.format}</span></p>
          <p>Status: <span className="text-ink">{tournament?.status}</span></p>
          <p>Organizer: <span className="text-ink">{tournament?.organizer}</span></p>
          <p>Teams: <span className="text-ink">{tournament?.teamsRegistered}/{tournament?.teamsCap}</span></p>
          <p>Entry fee: <span className="text-ink">₹{tournament?.entryFee?.toLocaleString("en-IN")}</span></p>
        </div>
        {tournament?.status === "Completed" && teams.length > 0 && (
          <div className="mt-4 border-t border-court-line pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-ink-faint">Download certificate</p>
            <div className="space-y-1.5">
              {teams.map((t: any) => (
                <a
                  key={t.id}
                  href={`/api/tournaments/${tournament.id}/certificate?teamId=${t.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-sm text-ink-muted hover:border-volt/40 hover:text-ink"
                >
                  {t.name} <span className="text-xs text-volt">PDF</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </Modal>
    );
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="REGISTER TEAM" subtitle={tournament?.name}>
        {teams.length === 0 ? (
          <p className="text-sm text-ink-muted">
            You don&apos;t have a {tournament?.sport} team yet. Create one from the Teams page first.
          </p>
        ) : (
          <>
            <p className="text-xs text-ink-faint">Choose which of your teams to enter:</p>
            <div className="mt-3 space-y-2">
              {teams.map((t: any) => (
                <label key={t.id} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors ${teamId === t.id ? "border-volt bg-volt/10" : "border-court-line hover:border-volt/40"}`}>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-ink-faint">{t.members} members</span>
                  <input type="radio" name="team" className="sr-only" checked={teamId === t.id} onChange={() => setTeamId(t.id)} />
                </label>
              ))}
            </div>
            
            {tournament?.entryFee > 0 && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center text-sm">
                <span className="text-slate-400">Entry Fee:</span>
                <span className="font-bold text-white">₹{tournament.entryFee.toLocaleString()}</span>
              </div>
            )}

            <Button className="mt-5 w-full" onClick={submit} disabled={submitting}>
              {submitting ? "Processing…" : tournament?.entryFee > 0 ? `Pay ₹${tournament.entryFee} & Register` : "Register team"}
            </Button>
          </>
        )}
      </Modal>

      {showPayment && paymentSession && (
        <DemoPaymentModal 
          isOpen={showPayment} 
          onClose={() => {
            setShowPayment(false);
            onClose();
          }}
          onSuccess={(txId) => {
            setShowPayment(false);
            onClose();
            onRegistered();
          }}
          sessionToken={paymentSession.sessionToken}
          idempotencyKey={paymentSession.idempotencyKey}
          expiresAt={paymentSession.expiresAt}
          amount={tournament.entryFee}
          upiLink={paymentSession.upiLink}
        />
      )}
    </>
  );
}

// Task 30, Phase 6: sponsors previously only appeared in the organizer's
// own "Sponsors & Gallery" management modal — nothing showed them to
// players browsing the public tournament list. Reuses the same
// GET /api/tournaments/:id/sponsors the management modal already calls.
function SponsorStrip({ tournamentId }: { tournamentId: string }) {
  const { data } = useApiGet<{ sponsors: any[] }>(`/api/tournaments/${tournamentId}/sponsors`);
  const sponsors = data?.sponsors ?? [];
  if (sponsors.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-court-line pt-3 text-[11px] text-ink-faint">
      <span className="uppercase tracking-widest">Sponsored by</span>
      {sponsors.map((s: any) => (
        <span key={s.id} className="flex items-center gap-1 font-medium text-ink-muted">
          {s.name}
          <Badge tone="muted">{s.tier}</Badge>
        </span>
      ))}
    </div>
  );
}

function BrowseTournamentsView() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const qs = tab === "All" ? "" : `?status=${encodeURIComponent(tab)}`;
  const { data, loading, refresh } = useApiGet<{ tournaments: any[] }>(`/api/tournaments${qs}`, [qs]);
  const list = data?.tournaments ?? [];
  const [registerFor, setRegisterFor] = useState<any | null>(null);
  const [fixturesFor, setFixturesFor] = useState<any | null>(null);
  const [standingsFor, setStandingsFor] = useState<any | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="max-w-md text-sm text-ink-muted">
        Browse tournaments running across Ahmedabad and register your team for one that&apos;s still open.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${tab === t ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-ink-faint">Loading…</p>}
        {!loading && list.length === 0 && <p className="text-sm text-ink-faint">No tournaments found.</p>}
        {list.map((t) => {
          const pct = Math.round((t.teamsRegistered / t.teamsCap) * 100);
          return (
            <Card key={t.id} hover glow className="p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="volt">{t.sport}</Badge>
                    <Badge tone={statusTone[t.status] ?? "muted"}>{t.status}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg tracking-wide">{t.name.toUpperCase()}</h3>
                  <p className="mt-1 text-xs text-ink-faint">{t.format} · Organized by {t.organizer}</p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
                    <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-ink-faint" /> {new Date(t.startDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Wallet size={14} className="text-ink-faint" /> ₹{t.entryFee.toLocaleString("en-IN")} entry</span>
                    <span className="flex items-center gap-1.5"><Users size={14} className="text-ink-faint" /> {t.teamsRegistered}/{t.teamsCap} teams</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-court">
                    <div className="h-full rounded-full bg-gradient-to-r from-volt to-volt/70 transition-[width] duration-1000 ease-spring" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {t.bracketType === "LEAGUE" ? (
                    <Button size="sm" variant="outline" onClick={() => setStandingsFor(t)}><ListChecks size={14} /> Standings</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setFixturesFor(t)}><ListChecks size={14} /> Fixtures</Button>
                  )}
                  <Button size="sm" disabled={t.status !== "Registration Open"} onClick={() => setRegisterFor(t)}>
                    {t.status === "Registration Open" ? "Register team" : "View details"}
                  </Button>
                </div>
              </div>
              <SponsorStrip tournamentId={t.id} />
            </Card>
          );
        })}
      </div>

      <RegisterTeamModal
        open={!!registerFor}
        onClose={() => setRegisterFor(null)}
        tournament={registerFor}
        onRegistered={() => {
          alert("Team registered — awaiting organizer approval.");
          refresh();
        }}
      />
      <FixturesModal
        open={!!fixturesFor}
        onClose={() => setFixturesFor(null)}
        tournamentId={fixturesFor?.id ?? ""}
        tournamentName={fixturesFor?.name ?? ""}
      />
      <StandingsModal
        open={!!standingsFor}
        onClose={() => setStandingsFor(null)}
        tournamentId={standingsFor?.id ?? ""}
        tournamentName={standingsFor?.name ?? ""}
      />
    </div>
  );
}

export default function TournamentsPage() {
  const { role } = useAuth();
  return (
    <div className="pb-16">
      <Topbar title={role === "organizer" ? "My Tournaments" : "Tournaments"} />
      {role === "organizer" ? <ManageTournamentsView /> : <BrowseTournamentsView />}
    </div>
  );
}
