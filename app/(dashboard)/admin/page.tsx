"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ShieldCheck, Flag, TrendingUp, CheckCircle2, XCircle, Ban, RotateCcw, History, Search, Download, Calendar, Filter } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DatePicker } from "@/components/ui/DatePicker";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPatch } from "@/lib/api-client";
import { roleMeta, type Role } from "@/lib/role";

// Task 56, Phase 6: platform-wide trend chart — the StatCards above are
// point-in-time; this shows signups/bookings/tournaments week over week.
function PlatformAnalyticsPanel() {
  const { data } = useApiGet<{ series: any[]; totals: { signups: number; bookings: number; tournaments: number } }>("/api/admin/analytics");
  const series = data?.series ?? [];
  const maxValue = Math.max(1, ...series.flatMap((s: any) => [s.signups, s.bookings, s.tournaments]));

  return (
    <Card className="mt-4 p-6">
      <h3 className="font-display text-lg tracking-wide">PLATFORM TRENDS</h3>
      <p className="mt-1 text-xs text-ink-faint">Last 12 weeks · {data?.totals.signups ?? 0} signups · {data?.totals.bookings ?? 0} bookings · {data?.totals.tournaments ?? 0} tournaments created</p>

      {series.length === 0 ? (
        <p className="mt-3 text-xs text-ink-faint">Not enough data yet.</p>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-2" style={{ height: 90 }}>
            {series.map((s: any) => (
              <div key={s.week} className="group relative flex flex-1 items-end justify-center gap-0.5">
                <div className="w-1.5 rounded-t bg-volt" style={{ height: `${Math.max(2, (s.signups / maxValue) * 90)}px` }} />
                <div className="w-1.5 rounded-t bg-whistle" style={{ height: `${Math.max(2, (s.bookings / maxValue) * 90)}px` }} />
                <div className="w-1.5 rounded-t bg-ink-faint" style={{ height: `${Math.max(2, (s.tournaments / maxValue) * 90)}px` }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] text-court group-hover:block">
                  {s.week}: {s.signups} signups · {s.bookings} bookings · {s.tournaments} tournaments
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-faint">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-volt" /> Signups</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-whistle" /> Bookings</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ink-faint" /> Tournaments</span>
          </div>
        </>
      )}
    </Card>
  );
}

const roleFilters: { id: Role | "All"; label: string }[] = [
  { id: "All", label: "All roles" },
  { id: "player", label: "Players" },
  { id: "organizer", label: "Organizers" },
  { id: "venue", label: "Venue owners" },
  { id: "trainer", label: "Trainers" },
];

// Client-safe mirror of lib/api-format.ts's ROLE_TO_DB — kept local
// rather than importing the server file (which pulls in Next.js
// server-only pieces) just for this one small lookup table.
const ROLE_TO_DB_LOCAL: Record<string, string> = {
  player: "PLAYER",
  organizer: "ORGANIZER",
  venue: "VENUE_OWNER",
  trainer: "TRAINER",
  admin: "ADMIN",
};
const DB_ROLE_LABELS: Record<string, string> = {
  PLAYER: "Player",
  ORGANIZER: "Organizer",
  VENUE_OWNER: "Venue Owner",
  TRAINER: "Trainer",
  ADMIN: "Admin",
};

function ManageUsersTab() {
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const qs = roleFilter === "All" ? "" : `?role=${encodeURIComponent(roleFilter === "venue" ? "VENUE_OWNER" : roleFilter.toUpperCase())}`;
  const { data, loading, refresh } = useApiGet<{ users: any[] }>(`/api/admin/users${qs}`, [qs]);
  const users = data?.users ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);
  // Task 51, Phase 6: bulk selection for suspend/reactivate.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  async function toggleStatus(id: string, current: string) {
    setBusyId(id);
    try {
      await apiPatch(`/api/admin/users/${id}`, { status: current === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  // Task 53, Phase 6: role/permission management.
  async function changeRole(id: string, dbRole: string) {
    setBusyId(id);
    try {
      await apiPatch(`/api/admin/users/${id}`, { role: dbRole });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkSetStatus(status: "ACTIVE" | "SUSPENDED") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      // No bulk endpoint for users specifically (each suspend already has
      // per-user admin-protection checks worth keeping individual), so
      // this loops the existing single-user PATCH — still one button
      // click for the admin instead of N.
      await Promise.all(ids.map((id) => apiPatch(`/api/admin/users/${id}`, { status }).catch(() => null)));
      setSelected(new Set());
      refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg tracking-wide">MANAGE USERS</h3>
        <div className="flex flex-wrap gap-2">
          {roleFilters.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors ${roleFilter === r.id ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:text-ink"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-volt/5 px-3 py-2 text-xs">
          <span className="text-ink-muted">{selected.size} selected</span>
          <button onClick={() => bulkSetStatus("SUSPENDED")} disabled={bulkBusy} className="focus-ring rounded-lg bg-whistle/10 px-2.5 py-1 font-medium text-whistle hover:bg-whistle/20">Suspend all</button>
          <button onClick={() => bulkSetStatus("ACTIVE")} disabled={bulkBusy} className="focus-ring rounded-lg bg-volt/10 px-2.5 py-1 font-medium text-volt hover:bg-volt/20">Reactivate all</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-ink-faint hover:text-ink">Clear</button>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {loading && <p className="text-sm text-ink-faint">Loading users…</p>}
        {!loading && users.length === 0 && <p className="text-sm text-ink-faint">No users found.</p>}
        {users.map((u: any) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-court-line px-4 py-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggleSelect(u.id)}
                disabled={u.role === "admin"}
                className="mt-1 h-4 w-4 accent-volt disabled:opacity-30"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{u.name}</p>
                  <select
                    value={ROLE_TO_DB_LOCAL[u.role] ?? "PLAYER"}
                    disabled={busyId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="focus-ring rounded-full border border-court-line bg-court px-2 py-0.5 text-[11px] text-ink-muted"
                    title="Change role"
                  >
                    {Object.entries(DB_ROLE_LABELS).map(([db, label]) => <option key={db} value={db}>{label}</option>)}
                  </select>
                  <Badge tone={u.status === "ACTIVE" ? "volt" : "whistle"}>{u.status === "ACTIVE" ? "Active" : "Suspended"}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {u.email}{u.phone ? ` · ${u.phone}` : ""}{u.area ? ` · ${u.area}` : ""}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  {u.role === "venue" && `${u.venuesOwned} venue(s) listed`}
                  {u.role === "organizer" && `${u.tournamentsOrganized} tournament(s) organized`}
                  {u.role === "player" && `${u.matchesPlayed} matches played · ${u.tournamentsWon} tournaments won`}
                  {u.role === "trainer" && (u.organizationName || "Trainer / Academy")}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={u.status === "ACTIVE" ? "outline" : "secondary"}
              disabled={busyId === u.id || u.role === "admin"}
              onClick={() => toggleStatus(u.id, u.status)}
            >
              {u.status === "ACTIVE" ? <><Ban size={14} /> Suspend</> : <><RotateCcw size={14} /> Reactivate</>}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AuditLogTab() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const searchParams = new URLSearchParams();
  if (q) searchParams.set("q", q);
  if (category && category !== "All") searchParams.set("category", category);
  if (roleFilter && roleFilter !== "All") searchParams.set("role", roleFilter);
  if (startDate) searchParams.set("startDate", startDate);
  if (endDate) searchParams.set("endDate", endDate);

  const qs = searchParams.toString();
  const apiEndpoint = qs ? `/api/admin/audit-log?${qs}` : "/api/admin/audit-log";

  const { data, loading } = useApiGet<{ logs: any[] }>(apiEndpoint);
  const logs = data?.logs ?? [];

  const roleColors: Record<string, string> = {
    PLAYER: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    ORGANIZER: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    VENUE_OWNER: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    TRAINER: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
    ADMIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><History size={16} className="text-volt" /> AUDIT LOG</h3>
          <p className="mt-1 text-xs text-ink-faint">Granular activity tracking across all platform roles.</p>
        </div>
        <div className="flex gap-2">
          {(q || category !== "All" || roleFilter !== "All" || startDate || endDate) && (
            <button 
              onClick={() => { setQ(""); setCategory("All"); setRoleFilter("All"); setStartDate(""); setEndDate(""); }} 
              className="focus-ring flex items-center gap-2 rounded-lg border border-court-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-volt/40 hover:text-volt"
            >
              <XCircle size={14} /> Clear
            </button>
          )}
          <a href={`/api/admin/audit-log?format=csv&${qs}`} className="focus-ring flex items-center gap-2 rounded-lg border border-court-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-volt/40 hover:text-volt">
            <Download size={14} /> CSV
          </a>
          <a href={`/api/admin/audit-log?format=xlsx&${qs}`} className="focus-ring flex items-center gap-2 rounded-lg border border-court-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-volt/40 hover:text-volt bg-court-surface">
            <Download size={14} className="text-emerald-500" /> Excel (.xlsx)
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action or detail..."
            className="focus-ring w-full rounded-lg border border-court-line bg-court-surface py-2 pl-9 pr-3 text-sm text-ink outline-none"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="focus-ring w-full appearance-none rounded-lg border border-court-line bg-court-surface py-2 pl-9 pr-8 text-sm text-ink outline-none"
          >
            <option value="All">All Categories</option>
            <option value="PAYMENT">Payment</option>
            <option value="BOOKING">Booking</option>
            <option value="VENUE">Venue</option>
            <option value="TOURNAMENT">Tournament</option>
            <option value="PLAYER_REQUEST">Player Request</option>
            <option value="INQUIRY">Inquiry</option>
            <option value="SECURITY">Security</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="relative">
          <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="focus-ring w-full appearance-none rounded-lg border border-court-line bg-court-surface py-2 pl-9 pr-8 text-sm text-ink outline-none"
          >
            <option value="All">All Roles</option>
            <option value="PLAYER">Player</option>
            <option value="ORGANIZER">Organizer</option>
            <option value="VENUE_OWNER">Venue Owner</option>
            <option value="TRAINER">Trainer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <DatePicker
          value={startDate}
          onChange={setStartDate}
          label="From:"
        />
        <DatePicker
          value={endDate}
          onChange={setEndDate}
          label="To:"
        />
      </div>

      <div className="mt-2 flex gap-4 text-xs font-medium">
        <span className="text-ink-faint">Quick dates:</span>
        <button onClick={() => { const d = new Date(); const ds = d.toISOString().split('T')[0]; setStartDate(ds); setEndDate(ds); }} className="text-ink-muted hover:text-volt">Today</button>
        <button onClick={() => { const d = new Date(); const d2 = new Date(); d2.setDate(d.getDate() - 7); setStartDate(d2.toISOString().split('T')[0]); setEndDate(d.toISOString().split('T')[0]); }} className="text-ink-muted hover:text-volt">Last 7 Days</button>
        <button onClick={() => { const d = new Date(); const d2 = new Date(); d2.setDate(d.getDate() - 30); setStartDate(d2.toISOString().split('T')[0]); setEndDate(d.toISOString().split('T')[0]); }} className="text-ink-muted hover:text-volt">Last 30 Days</button>
      </div>

      <div className="mt-6 rounded-xl border border-court-line bg-court overflow-hidden">
        <div className="grid grid-cols-12 border-b border-court-line bg-court-surface px-4 py-3 text-xs font-semibold text-ink-muted">
          <div className="col-span-3">TIMESTAMP</div>
          <div className="col-span-3">ACTOR</div>
          <div className="col-span-3">ACTION</div>
          <div className="col-span-3">DETAILS</div>
        </div>
        <div className="divide-y divide-court-line max-h-[500px] overflow-y-auto">
          {loading && <div className="p-8 text-center text-sm text-ink-faint">Loading...</div>}
          {!loading && logs.length === 0 && <div className="p-8 text-center text-sm text-ink-faint">No logs match your filters.</div>}
          {logs.map((l: any) => (
            <div key={l.id} className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-court-surface/50 transition-colors">
              <div className="col-span-3 text-ink-muted">
                {new Date(l.timestamp).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
              </div>
              <div className="col-span-3 flex flex-col gap-1 pr-2">
                <span className="font-medium text-ink truncate">{l.actor}</span>
                <span className={`w-fit rounded border px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${roleColors[l.role] || 'border-court-line text-ink-muted'}`}>
                  {l.role}
                </span>
              </div>
              <div className="col-span-3 flex flex-col gap-1 pr-2">
                <span className="font-semibold text-volt truncate">{l.action.replace(/_/g, " ")}</span>
                <span className="text-[10px] font-medium text-ink-faint tracking-wider">{l.category}</span>
              </div>
              <div className="col-span-3 text-ink-muted truncate" title={l.detail}>
                {l.detail || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"overview" | "users" | "audit">("overview");
  // Task 51, Phase 6: bulk selection for the moderation queue and reports.
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const { data: approvalsData, refresh: refreshApprovals } = useApiGet<{ approvals: any[] }>(role === "admin" ? "/api/admin/approvals" : null, [role]);
  const { data: reportsData, refresh: refreshReports } = useApiGet<{ reports: any[] }>(role === "admin" ? "/api/admin/reports" : null, [role]);
  const { data: usersData } = useApiGet<{ users: any[] }>(role === "admin" ? "/api/admin/users" : null, [role]);
  const approvals = approvalsData?.approvals ?? [];
  const reports = reportsData?.reports ?? [];
  const totalUsers = usersData?.users?.length ?? 0;
  const activeVenues = approvals.filter((a: any) => a.type === "Venue" && a.status === "Active").length;
  const pendingTrainers = approvals.filter((a: any) => (a.type === "Trainer" || a.type === "Academy") && a.status === "Under review").length;

  useEffect(() => {
    if (!authLoading && role !== "admin") router.replace("/dashboard");
  }, [authLoading, role, router]);

  if (authLoading || role !== "admin") return null;

  async function toggleListing(id: string, type: string, activate: boolean) {
    try {
      await apiPatch(`/api/admin/approvals/${id}`, { approve: activate, type });
      refreshApprovals();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function decideReport(id: string, action: "dismiss" | "remove") {
    try {
      await apiPatch(`/api/admin/reports/${id}`, { action });
      refreshReports();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // Task 51, Phase 6: approvals selected across mixed types (Venue/
  // Trainer/Academy) are grouped and sent as separate bulk requests per
  // type, since the backend route takes one `type` per call.
  async function bulkDecideApprovals(approve: boolean) {
    const items = approvals.filter((a: any) => selectedApprovals.has(`${a.type}-${a.id}`));
    if (items.length === 0) return;
    setBulkBusy(true);
    try {
      const byType = new Map<string, string[]>();
      for (const item of items) {
        const list = byType.get(item.type) ?? [];
        list.push(item.id);
        byType.set(item.type, list);
      }
      await Promise.all(
        Array.from(byType.entries()).map(([type, ids]) =>
          apiPatch("/api/admin/approvals", { ids, type, approve }).catch(() => null)
        )
      );
      setSelectedApprovals(new Set());
      refreshApprovals();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDismissReports() {
    const ids = Array.from(selectedReports);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await apiPatch("/api/admin/reports", { ids });
      setSelectedReports(new Set());
      refreshReports();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleApprovalSelect(key: string) {
    setSelectedApprovals((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleReportSelect(id: string) {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="pb-16">
      <Topbar title="Admin Console" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total users" value={totalUsers} icon={<Users size={16} />} />
          <StatCard label="Active venues" value={activeVenues} icon={<ShieldCheck size={16} />} accent="blue" />
          <StatCard label="Open reports" value={reports.length} icon={<Flag size={16} />} accent="whistle" />
          <StatCard label="Pending trainer/academy" value={pendingTrainers} icon={<TrendingUp size={16} />} />
        </div>

        <PlatformAnalyticsPanel />

        <div className="mt-8 flex gap-2 border-b border-court-line">
          {[
            { id: "overview" as const, label: "Venues & Reports" },
            { id: "users" as const, label: "Manage Users" },
            { id: "audit" as const, label: "Audit Log" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`focus-ring -mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? "border-volt text-volt" : "border-transparent text-ink-muted hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-display text-lg tracking-wide">MODERATION QUEUE</h3>
              <p className="mt-1 text-xs text-ink-faint">Venues go live immediately when listed. Trainers and academies stay hidden from the public directory until approved here.</p>
              {selectedApprovals.size > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-volt/5 px-3 py-2 text-xs">
                  <span className="text-ink-muted">{selectedApprovals.size} selected</span>
                  <button onClick={() => bulkDecideApprovals(true)} disabled={bulkBusy} className="focus-ring rounded-lg bg-volt/10 px-2.5 py-1 font-medium text-volt hover:bg-volt/20">Approve all</button>
                  <button onClick={() => bulkDecideApprovals(false)} disabled={bulkBusy} className="focus-ring rounded-lg bg-whistle/10 px-2.5 py-1 font-medium text-whistle hover:bg-whistle/20">Reject all</button>
                  <button onClick={() => setSelectedApprovals(new Set())} className="ml-auto text-ink-faint hover:text-ink">Clear</button>
                </div>
              )}
              <div className="mt-4 space-y-3">
                {approvals.length === 0 && <p className="text-sm text-ink-faint">Nothing to review yet.</p>}
                {approvals.map((p: any) => (
                  <div key={`${p.type}-${p.id}`} className="flex items-center justify-between rounded-xl border border-court-line px-4 py-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.has(`${p.type}-${p.id}`)}
                        onChange={() => toggleApprovalSelect(`${p.type}-${p.id}`)}
                        className="mt-1 h-4 w-4 accent-volt"
                      />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge tone="muted">{p.type}</Badge>
                          <Badge tone={p.status === "Active" ? "volt" : "whistle"}>{p.status}</Badge>
                          <span className="text-xs text-ink-faint">by {p.submittedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleListing(p.id, p.type, true)} className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-volt/10 text-volt hover:bg-volt/20">
                        <CheckCircle2 size={16} />
                      </button>
                      <button onClick={() => toggleListing(p.id, p.type, false)} className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-whistle/10 text-whistle hover:bg-whistle/20">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-display text-lg tracking-wide">COMMUNITY REPORTS</h3>
              {selectedReports.size > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-volt/5 px-3 py-2 text-xs">
                  <span className="text-ink-muted">{selectedReports.size} selected</span>
                  <button onClick={bulkDismissReports} disabled={bulkBusy} className="focus-ring rounded-lg bg-volt/10 px-2.5 py-1 font-medium text-volt hover:bg-volt/20">Dismiss all</button>
                  <button onClick={() => setSelectedReports(new Set())} className="ml-auto text-ink-faint hover:text-ink">Clear</button>
                </div>
              )}
              <div className="mt-4 space-y-3">
                {reports.length === 0 && <p className="text-sm text-ink-faint">No open reports.</p>}
                {reports.map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-court-line px-4 py-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedReports.has(r.id)}
                        onChange={() => toggleReportSelect(r.id)}
                        className="mt-1 h-4 w-4 accent-volt"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.reason}</p>
                        <p className="mt-1 text-xs text-ink-faint">Post by {r.author} · {new Date(r.time).toLocaleDateString()}</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => decideReport(r.id, "dismiss")}>Dismiss</Button>
                          <Button size="sm" variant="secondary" onClick={() => decideReport(r.id, "remove")}>Remove post</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "users" && (
          <div className="mt-6">
            <ManageUsersTab />
          </div>
        )}

        {tab === "audit" && (
          <div className="mt-6">
            <AuditLogTab />
          </div>
        )}
      </div>
    </div>
  );
}
