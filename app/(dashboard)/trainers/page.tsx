"use client";

import { useState } from "react";
import {
  Star, MapPin, Users, GraduationCap, PlusCircle, MessageCircle, Package, Video, Apple,
  Calendar, Award, Globe, Clock, Lock, PlayCircle, X, Check, RefreshCw, Settings,
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { sports } from "@/lib/mock-data";
import { DemoPaymentModal } from "@/components/payments/DemoPaymentModal";

const MODES = ["Offline", "Online", "Hybrid"];

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5 text-whistle">
      <Star size={size} fill="currentColor" /> <span className="text-ink font-semibold">{value || "New"}</span>
    </span>
  );
}

function ChipInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState("");
  function add() {
    if (text.trim() && !values.includes(text.trim())) onChange([...values, text.trim()]);
    setText("");
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-full bg-volt/10 px-2.5 py-1 text-xs text-volt">
            {v} <button onClick={() => onChange(values.filter((x) => x !== v))}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} className="focus-ring flex-1 rounded-lg border border-court-line bg-court px-3 py-1.5 text-xs" />
        <Button size="sm" variant="outline" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Profile --

function ProfileEditModal({ open, onClose, trainer, onSaved }: { open: boolean; onClose: () => void; trainer: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    sport: trainer?.sport ?? sports[0], experience: trainer?.experience ?? "", area: trainer?.area ?? "",
    price: trainer?.price ?? "", tag: trainer?.tag ?? "", bio: trainer?.bio ?? "",
    introVideo: trainer?.introVideo ?? "", responseTime: trainer?.responseTime ?? "",
  });
  const [specializations, setSpecializations] = useState<string[]>(trainer?.specializations ?? []);
  const [certifications, setCertifications] = useState<string[]>(trainer?.certifications ?? []);
  const [languages, setLanguages] = useState<string[]>(trainer?.languages ?? []);
  const [modes, setModes] = useState<string[]>(trainer?.sessionModes ?? ["Offline"]);
  const [saving, setSaving] = useState(false);

  function toggleMode(m: string) {
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function save() {
    setSaving(true);
    try {
      await apiPost("/api/trainers", {
        ...form, specializations, certifications, languages,
        sessionModes: modes.length ? modes : ["Offline"],
      });
      onSaved();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ACADEMY PROFILE" width="lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
          {sports.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input placeholder="Experience (e.g. 8 years)" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
        <input placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
        <input placeholder="Starting price (e.g. ₹600/session)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
        <input placeholder="Tag (e.g. Top Rated)" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
        <input placeholder="Typical response time" value={form.responseTime} onChange={(e) => setForm({ ...form, responseTime: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
      </div>
      <textarea placeholder="Bio — your coaching philosophy, achievements, who you work best with…" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="focus-ring mt-3 w-full resize-none rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
      <input placeholder="Intro video URL (YouTube/Vimeo, optional)" value={form.introVideo} onChange={(e) => setForm({ ...form, introVideo: e.target.value })} className="focus-ring mt-3 w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-faint">Session modes offered</p>
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button key={m} onClick={() => toggleMode(m)} className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium ${modes.includes(m) ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>{m}</button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-faint">Specializations</p>
        <ChipInput values={specializations} onChange={setSpecializations} placeholder="e.g. Fast bowling" />
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-faint">Certifications</p>
        <ChipInput values={certifications} onChange={setCertifications} placeholder="e.g. BCCI Level 2" />
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-faint">Languages</p>
        <ChipInput values={languages} onChange={setLanguages} placeholder="e.g. Hindi, English" />
      </div>

      <Button className="mt-5 w-full" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
    </Modal>
  );
}

// ---------------------------------------------------------------- Packages --

function PackageManager({ trainerId }: { trainerId: string }) {
  const { data, refresh } = useApiGet<{ packages: any[] }>(`/api/trainers/${trainerId}/packages`);
  const packages = data?.packages ?? [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", sessionCount: 4, validityDays: 30, price: 2000, mode: "Offline" });
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!form.name) return alert("Package name is required.");
    setSaving(true);
    try {
      await apiPost(`/api/trainers/${trainerId}/packages`, form);
      setForm({ name: "", description: "", sessionCount: 4, validityDays: 30, price: 2000, mode: "Offline" });
      setShowForm(false);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(pkg: any) {
    try {
      await apiPatch(`/api/packages/${pkg.id}`, { active: !pkg.active });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Bundle sessions into packages students can purchase up front.</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><PlusCircle size={14} /> New package</Button>
      </div>

      {showForm && (
        <Card className="mt-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Package name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm sm:col-span-2" />
            <input type="number" placeholder="Sessions included" value={form.sessionCount} onChange={(e) => setForm({ ...form, sessionCount: Number(e.target.value) })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
            <input type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
            <input type="number" placeholder="Validity (days)" value={form.validityDays} onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm text-ink-muted">
              {MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
            <textarea placeholder="What's included (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm sm:col-span-2" />
          </div>
          <Button size="sm" className="mt-3" onClick={create} disabled={saving}>{saving ? "Creating…" : "Create package"}</Button>
        </Card>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {packages.map((p: any) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-semibold">{p.name}</h4>
              <Badge tone={p.active ? "volt" : "muted"}>{p.active ? "Active" : "Archived"}</Badge>
            </div>
            {p.description && <p className="mt-1 text-xs text-ink-faint">{p.description}</p>}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <span>{p.sessionCount} sessions</span>
              <span>{p.validityDays} days validity</span>
              <span>{p.mode}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-court-line pt-3">
              <span className="font-display text-base">₹{p.price}</span>
              <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>{p.active ? "Archive" : "Reactivate"}</Button>
            </div>
          </Card>
        ))}
        {packages.length === 0 && <p className="text-sm text-ink-faint">No packages yet.</p>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Video library --

function VideoManager({ trainerId }: { trainerId: string }) {
  const { data, refresh } = useApiGet<{ videos: any[] }>(`/api/trainers/${trainerId}/videos`);
  const videos = data?.videos ?? [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", description: "", category: "", isPremium: false });
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!form.title || !form.url) return alert("Title and video URL are required.");
    setSaving(true);
    try {
      await apiPost(`/api/trainers/${trainerId}/videos`, form);
      setForm({ title: "", url: "", description: "", category: "", isPremium: false });
      setShowForm(false);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Share technique breakdowns and drills — mark premium ones for package holders only.</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><PlusCircle size={14} /> Add video</Button>
      </div>

      {showForm && (
        <Card className="mt-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm sm:col-span-2" />
            <input placeholder="Video URL (YouTube/Vimeo)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm sm:col-span-2" />
            <input placeholder="Category (e.g. Technique)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm({ ...form, isPremium: e.target.checked })} className="h-4 w-4 accent-volt" /> Premium (package holders only)
            </label>
            <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm sm:col-span-2" />
          </div>
          <Button size="sm" className="mt-3" onClick={create} disabled={saving}>{saving ? "Adding…" : "Add video"}</Button>
        </Card>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v: any) => (
          <Card key={v.id} className="p-4">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-volt/10 text-volt"><PlayCircle size={16} /></span>
              {v.isPremium && <Badge tone="whistle">Premium</Badge>}
            </div>
            <h4 className="mt-2 text-sm font-semibold">{v.title}</h4>
            {v.category && <p className="text-xs text-ink-faint">{v.category}</p>}
          </Card>
        ))}
        {videos.length === 0 && <p className="text-sm text-ink-faint">No videos yet.</p>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------- Sessions --

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Task 20, Phase 5: lets the trainer define their weekly recurring
// availability, which BookSessionModal (above) then reads to show
// students real open slots instead of a free-text time guess.
// Task 38, Phase 6: marks today's batch attendance for one student.
function MarkAttendanceButtons({ enrollmentId, onMarked }: { enrollmentId: string; onMarked: () => void }) {
  const [marking, setMarking] = useState<"present" | "absent" | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function mark(present: boolean) {
    setMarking(present ? "present" : "absent");
    try {
      await apiPost(`/api/students/${enrollmentId}/attendance`, { date: today, present });
      onMarked();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setMarking(null);
    }
  }

  return (
    <div className="flex gap-1">
      <button onClick={() => mark(true)} disabled={!!marking} title="Mark present today" className="focus-ring flex h-6 w-6 items-center justify-center rounded-md text-ink-faint hover:bg-volt/10 hover:text-volt">
        <Check size={12} />
      </button>
      <button onClick={() => mark(false)} disabled={!!marking} title="Mark absent today" className="focus-ring flex h-6 w-6 items-center justify-center rounded-md text-ink-faint hover:bg-whistle/10 hover:text-whistle">
        <X size={12} />
      </button>
    </div>
  );
}

function AvailabilityManager({ trainerId }: { trainerId: string }) {
  const { data, refresh } = useApiGet<{ availability: any[] }>(`/api/trainers/${trainerId}/availability`);
  const windows = data?.availability ?? [];
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [saving, setSaving] = useState(false);

  async function addWindow() {
    setSaving(true);
    try {
      await apiPost(`/api/trainers/${trainerId}/availability`, { dayOfWeek, startTime, endTime });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeWindow(id: string) {
    try {
      await apiDelete(`/api/trainers/${trainerId}/availability/${id}`);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <Card className="p-5">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-faint">Weekly availability</h4>
      <p className="mb-3 text-xs text-ink-faint">Students see these as bookable 1-hour slots when booking a session with you.</p>

      {windows.length === 0 && <p className="mb-3 text-sm text-ink-faint">No availability set yet — add your first window below.</p>}
      <div className="mb-4 space-y-1.5">
        {windows.map((w: any) => (
          <div key={w.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-1.5 text-xs">
            <span><span className="font-medium">{w.day}</span> · {w.startTime}–{w.endTime}</span>
            <button onClick={() => removeWindow(w.id)} aria-label="Remove window" className="focus-ring flex h-6 w-6 items-center justify-center rounded-md text-ink-faint hover:bg-whistle/10 hover:text-whistle">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="focus-ring rounded-lg border border-court-line bg-court px-2.5 py-2 text-xs">
          {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="focus-ring rounded-lg border border-court-line bg-court px-2.5 py-2 text-xs" />
        <span className="text-xs text-ink-faint">to</span>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="focus-ring rounded-lg border border-court-line bg-court px-2.5 py-2 text-xs" />
        <Button size="sm" onClick={addWindow} disabled={saving}>Add</Button>
      </div>
    </Card>
  );
}

function SessionsManager({ trainerId, trainerUserId }: { trainerId: string; trainerUserId: string }) {
  const { data, refresh } = useApiGet<{ sessions: any[] }>(`/api/trainers/${trainerId}/sessions`);
  const sessions = data?.sessions ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markComplete(id: string) {
    setBusyId(id);
    try {
      await apiPatch(`/api/sessions/${id}`, { status: "COMPLETED" });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function respondReschedule(id: string, approve: boolean) {
    setBusyId(id);
    try {
      await apiPatch(`/api/sessions/${id}/reschedule`, { approve });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const upcoming = sessions.filter((s: any) => s.status === "SCHEDULED");
  const past = sessions.filter((s: any) => s.status !== "SCHEDULED");

  return (
    <div className="space-y-6">
      <AvailabilityManager trainerId={trainerId} />

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-faint">Upcoming ({upcoming.length})</h4>
        <div className="space-y-2.5">
          {upcoming.length === 0 && <p className="text-sm text-ink-faint">No upcoming sessions.</p>}
          {upcoming.map((s: any) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{s.studentName}</p>
                  <p className="flex items-center gap-1.5 text-xs text-ink-muted"><Calendar size={12} /> {s.date} · {s.time} · {s.mode}</p>
                </div>
                <Badge tone="volt">{s.mode}</Badge>
              </div>
              {s.meetingLink && <p className="mt-1 truncate text-xs text-volt">{s.meetingLink}</p>}
              {s.notes && <p className="mt-1 text-xs text-ink-faint">{s.notes}</p>}

              {s.rescheduleStatus === "PENDING" && s.rescheduleByUserId !== trainerUserId && (
                <div className="mt-3 rounded-lg border border-whistle/40 bg-whistle/10 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-whistle"><RefreshCw size={12} /> Reschedule requested</p>
                  <p className="mt-1 text-xs text-ink-muted">Proposed: {s.proposedDate} at {s.proposedTime}{s.rescheduleReason ? ` — "${s.rescheduleReason}"` : ""}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" disabled={busyId === s.id} onClick={() => respondReschedule(s.id, true)}><Check size={12} /> Approve</Button>
                    <Button size="sm" variant="outline" disabled={busyId === s.id} onClick={() => respondReschedule(s.id, false)}>Decline</Button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex justify-end border-t border-court-line pt-3">
                <Button size="sm" variant="outline" disabled={busyId === s.id} onClick={() => markComplete(s.id)}>Mark complete</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-faint">Past</h4>
          <div className="space-y-1.5">
            {past.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-xs">
                <span>{s.studentName} · {s.date}</span>
                <Badge tone={s.status === "COMPLETED" ? "volt" : "muted"}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsList({ trainerId }: { trainerId: string }) {
  const { data } = useApiGet<{ reviews: any[] }>(`/api/trainers/${trainerId}/reviews`);
  const reviews = data?.reviews ?? [];
  return (
    <div className="space-y-2.5">
      {reviews.length === 0 && <p className="text-sm text-ink-faint">No reviews yet.</p>}
      {reviews.map((r: any) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{r.userName}</span>
            <Stars value={r.rating} />
          </div>
          {r.comment && <p className="mt-1.5 text-xs text-ink-muted">{r.comment}</p>}
        </Card>
      ))}
    </div>
  );
}

// ------------------------------------------------------------- Diet plans --

function DietPlanManager({ trainerId }: { trainerId: string }) {
  const { data, refresh } = useApiGet<{ plans: any[] }>(`/api/trainers/${trainerId}/diet-plans`);
  const plans = data?.plans ?? [];
  const templates = plans.filter((p: any) => p.isTemplate);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", goal: "Weight loss", description: "", isPremium: false, isTemplate: false });
  const [saving, setSaving] = useState(false);

  function applyTemplate(t: any) {
    setForm({ title: `${t.title} (copy)`, goal: t.goal, description: t.description ?? "", isPremium: t.isPremium, isTemplate: false });
    setShowForm(true);
  }

  async function create() {
    if (!form.title || !form.description) return alert("Title and description are required.");
    setSaving(true);
    try {
      await apiPost(`/api/trainers/${trainerId}/diet-plans`, form);
      setForm({ title: "", goal: "Weight loss", description: "", isPremium: false, isTemplate: false });
      setShowForm(false);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Publish nutrition guidance for your students.</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><PlusCircle size={14} /> New plan</Button>
      </div>

      {templates.length > 0 && !showForm && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-ink-faint">Start from a template:</span>
          {templates.map((t: any) => (
            <button key={t.id} onClick={() => applyTemplate(t)} className="focus-ring rounded-full border border-court-line px-3 py-1 text-xs text-ink-muted hover:border-volt/40 hover:text-volt">
              {t.title}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <Card className="mt-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm" />
            <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm text-ink-muted">
              <option>Weight loss</option><option>Muscle gain</option><option>Endurance</option><option>Match-day nutrition</option><option>General fitness</option>
            </select>
            <textarea placeholder="Plan details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="focus-ring rounded-lg border border-court-line bg-court px-3 py-2 text-sm sm:col-span-2" />
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm({ ...form, isPremium: e.target.checked })} className="h-4 w-4 accent-volt" /> Premium (package holders only)
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={form.isTemplate} onChange={(e) => setForm({ ...form, isTemplate: e.target.checked })} className="h-4 w-4 accent-volt" /> Save as reusable template
            </label>
          </div>
          <Button size="sm" className="mt-3" onClick={create} disabled={saving}>{saving ? "Publishing…" : "Publish plan"}</Button>
        </Card>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {plans.map((p: any) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-whistle/10 text-whistle"><Apple size={16} /></span>
              <div className="flex gap-1.5">
                {p.isTemplate && <Badge tone="muted">Template</Badge>}
                {p.isPremium && <Badge tone="whistle">Premium</Badge>}
              </div>
            </div>
            <h4 className="mt-2 text-sm font-semibold">{p.title}</h4>
            <Badge tone="muted">{p.goal}</Badge>
            {p.description && <p className="mt-2 text-xs text-ink-muted">{p.description}</p>}
          </Card>
        ))}
        {plans.length === 0 && <p className="text-sm text-ink-faint">No diet plans yet.</p>}
      </div>
    </div>
  );
}

// -------------------------------------------------------------- My Academy --

function MyAcademyView() {
  const { user } = useAuth();
  const { data, loading, refresh } = useApiGet<{ batches: any[]; students: any[]; inquiries: any[] }>("/api/dashboard");
  const { data: trainerData, refresh: refreshTrainer } = useApiGet<{ trainers: any[] }>("/api/trainers?mine=true");
  const trainer = trainerData?.trainers?.[0];
  const [tab, setTab] = useState<"overview" | "packages" | "videos" | "diet" | "sessions" | "reviews">("overview");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", time: "", days: "", venue: "" });
  const [replying, setReplying] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const batches = data?.batches ?? [];
  const students = data?.students ?? [];
  const inquiries = data?.inquiries ?? [];

  async function createBatch() {
    if (!form.name || !form.time || !form.days) return alert("Name, time and days are required.");
    try {
      await apiPost("/api/batches", form);
      setShowForm(false);
      setForm({ name: "", time: "", days: "", venue: "" });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function reply(id: string, text: string) {
    try {
      await apiPatch(`/api/inquiries/${id}`, { reply: text });
      setReplying(null);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (!trainer) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Card className="p-6">
          <h3 className="font-display text-lg tracking-wide">SET UP YOUR ACADEMY PROFILE</h3>
          <p className="mt-2 text-sm text-ink-muted">Add your sport, experience and bio to appear in the Trainers & Academies marketplace and start offering packages, videos and diet plans.</p>
          <Button className="mt-4" onClick={() => setEditingProfile(true)}><Settings size={14} /> Set up profile</Button>
        </Card>
        <ProfileEditModal open={editingProfile} onClose={() => setEditingProfile(false)} trainer={null} onSaved={refreshTrainer} />
      </div>
    );
  }

  const tabs: { id: typeof tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: GraduationCap },
    { id: "packages", label: "Packages", icon: Package },
    { id: "videos", label: "Video Library", icon: Video },
    { id: "diet", label: "Diet Plans", icon: Apple },
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-volt/15 text-sm font-bold text-volt">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              (user?.name ?? "?").split(" ").map((n) => n[0]).join("")
            )}
          </span>
          <div>
            <h3 className="font-display text-base tracking-wide">{user?.name?.toUpperCase()}</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <Stars value={trainer.rating} />
              <span className="text-xs text-ink-faint">({trainer.reviewCount} reviews) · {trainer.students} students</span>
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)}><Settings size={14} /> Edit profile</Button>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-court-line">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`focus-ring -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium ${tab === t.id ? "border-volt text-volt" : "border-transparent text-ink-muted"}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="max-w-md text-sm text-ink-muted">Manage your coaching batches, track student attendance and respond to new inquiries from players.</p>
              <Button onClick={() => setShowForm(!showForm)}><PlusCircle size={16} /> Create batch</Button>
            </div>

            {showForm && (
              <Card className="mt-6 p-6">
                <h3 className="font-display text-lg tracking-wide">NEW BATCH</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input placeholder="Batch name (e.g. U-14 Evening)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
                  <input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
                  <input placeholder="Time (e.g. 5:00-6:30 PM)" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
                  <input placeholder="Days (e.g. Mon/Wed/Fri)" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
                </div>
                <Button className="mt-5" onClick={createBatch}>Create</Button>
              </Card>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <h3 className="mb-3 font-display text-lg tracking-wide">MY BATCHES</h3>
                  {loading && <p className="text-sm text-ink-faint">Loading…</p>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {batches.map((b: any) => (
                      <Card key={b.id} hover glow className="p-5">
                        <h4 className="font-display text-base tracking-wide">{b.name.toUpperCase()}</h4>
                        <p className="mt-1 text-xs text-ink-faint">{b.days} · {b.time}</p>
                        <p className="text-xs text-ink-faint">{b.venue}</p>
                        <div className="mt-3 flex items-center justify-between border-t border-court-line pt-3">
                          <Badge tone="volt">{b.students} students</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-display text-lg tracking-wide">STUDENTS</h3>
                  <Card className="divide-y divide-court-line p-0">
                    {students.length === 0 && <p className="p-5 text-sm text-ink-faint">No students enrolled yet.</p>}
                    {students.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-ink-faint">{s.batch} · since {s.since}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs ${s.attendance >= 90 ? "text-volt" : s.attendance >= 80 ? "text-ink-muted" : "text-whistle"}`}>
                            {s.attendance}% attendance
                          </span>
                          <MarkAttendanceButtons enrollmentId={s.id} onMarked={refresh} />
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              </div>

              <Card className="h-fit p-6">
                <h3 className="mb-4 font-display text-lg tracking-wide">NEW INQUIRIES</h3>
                <div className="space-y-3">
                  {inquiries.length === 0 && <p className="text-sm text-ink-faint">No inquiries yet.</p>}
                  {inquiries.map((i: any) => (
                    <div key={i.id} className="rounded-xl border border-court-line p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{i.from}</p>
                        <span className="text-[10px] text-ink-faint">{new Date(i.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{i.message}</p>
                      {i.reply ? (
                        <p className="mt-2 rounded-lg bg-volt-soft px-2 py-1.5 text-xs text-volt">Replied: {i.reply}</p>
                      ) : replying === i.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); const v = (e.target as any).reply.value; if (v) reply(i.id, v); }} className="mt-2 flex gap-1.5">
                          <input name="reply" autoFocus placeholder="Type a reply…" className="focus-ring flex-1 rounded-lg border border-court-line bg-court px-2 py-1.5 text-xs" />
                          <button type="submit" className="rounded-lg bg-volt px-2.5 text-xs font-medium text-white">Send</button>
                        </form>
                      ) : (
                        <button onClick={() => setReplying(i.id)} className="focus-ring mt-2 flex items-center gap-1 text-xs font-medium text-volt hover:underline">
                          <MessageCircle size={12} /> Reply
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {tab === "packages" && <PackageManager trainerId={trainer.id} />}
        {tab === "videos" && <VideoManager trainerId={trainer.id} />}
        {tab === "diet" && <DietPlanManager trainerId={trainer.id} />}
        {tab === "sessions" && <SessionsManager trainerId={trainer.id} trainerUserId={trainer.userId} />}
        {tab === "reviews" && <ReviewsList trainerId={trainer.id} />}
      </div>

      <ProfileEditModal open={editingProfile} onClose={() => setEditingProfile(false)} trainer={trainer} onSaved={refreshTrainer} />
    </div>
  );
}

// =====================================================================
// Player-facing marketplace: browse, view a trainer's full profile,
// buy packages, unlock premium content, book & reschedule sessions.
// =====================================================================

function InquiryModal({ open, onClose, trainer }: { open: boolean; onClose: () => void; trainer: any }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await apiPost("/api/inquiries", { trainerId: trainer.id, message: message.trim() });
      setSent(true);
      setMessage("");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setSent(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="SEND INQUIRY" subtitle={trainer?.name}>
      {sent ? (
        <div className="py-4 text-center">
          <p className="text-sm font-medium text-volt">Inquiry sent!</p>
          <p className="mt-1 text-xs text-ink-faint">{trainer?.name} will get back to you shortly.</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-faint">
            Tell {trainer?.name} what you&apos;re looking for — batch timing, skill level, goals, etc.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Hi ${trainer?.name ?? ""}, I'm interested in...`}
            rows={4}
            className="focus-ring mt-3 w-full resize-none rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm placeholder:text-ink-faint"
          />
          <Button className="mt-4 w-full" onClick={send} disabled={sending}>
            {sending ? "Sending…" : "Send inquiry"}
          </Button>
        </>
      )}
    </Modal>
  );
}

// Task 40, Phase 6: a simple "mark as watched" action — a full scrubber-
// linked progress tracker would need an embedded player, but these are
// external YouTube/Vimeo links opened in a new tab, so this captures
// completion without needing to control playback.
function MarkVideoWatchedButton({ videoId, onMarked }: { videoId: string; onMarked: () => void }) {
  const [marking, setMarking] = useState(false);

  async function markWatched() {
    setMarking(true);
    try {
      await apiPatch(`/api/videos/${videoId}/progress`, { watchedSeconds: 0, completed: true });
      onMarked();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setMarking(false);
    }
  }

  return (
    <button onClick={markWatched} disabled={marking} className="focus-ring mt-1.5 text-xs text-ink-faint hover:text-volt">
      Mark as watched
    </button>
  );
}

function BookSessionModal({ open, onClose, trainer, myPurchases, onBooked }: { open: boolean; onClose: () => void; trainer: any; myPurchases: any[]; onBooked: () => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [mode, setMode] = useState(trainer?.sessionModes?.[0] ?? "Offline");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  // Task 20, Phase 5: shows the trainer's real open slots for the chosen
  // date (computed server-side from their weekly availability minus
  // already-booked sessions — see lib/trainer-availability.ts) instead of
  // a free-text time input the student had to guess at.
  const { data: slotsData } = useApiGet<{ openSlots: string[]; hasAvailabilitySet: boolean }>(
    open && trainer && date ? `/api/trainers/${trainer.id}/open-slots?date=${date}` : null,
    [open, trainer?.id, date]
  );
  const openSlots = slotsData?.openSlots ?? [];

  const usablePurchases = myPurchases.filter((p: any) => p.trainerId === trainer?.id && !p.expired && p.sessionsRemaining > 0);

  async function book() {
    if (!date || !time) return alert("Pick a date and time.");
    setBooking(true);
    try {
      await apiPost(`/api/trainers/${trainer.id}/sessions`, { date, time, mode, notes: notes || undefined, purchaseId: purchaseId || undefined });
      onBooked();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="BOOK A SESSION" subtitle={trainer?.name}>
      {usablePurchases.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-faint">Use a package (optional)</p>
          <select value={purchaseId} onChange={(e) => setPurchaseId(e.target.value)} className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
            <option value="">Pay per session instead</option>
            {usablePurchases.map((p: any) => <option key={p.id} value={p.id}>{p.packageName} — {p.sessionsRemaining} left</option>)}
          </select>
        </div>
      )}
      <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />

      {date && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-faint">Open times</p>
          {slotsData?.hasAvailabilitySet === false ? (
            <p className="text-xs text-ink-faint">This trainer hasn&apos;t set their weekly availability yet — pick any time and they&apos;ll confirm.</p>
          ) : openSlots.length === 0 ? (
            <p className="text-xs text-ink-faint">No open slots on this date — try another day.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {openSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`focus-ring rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${time === t ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:border-volt/40"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {(slotsData?.hasAvailabilitySet === false) && (
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="focus-ring mt-2 w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
          )}
        </div>
      )}

      <select value={mode} onChange={(e) => setMode(e.target.value)} className="focus-ring mt-3 w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
        {(trainer?.sessionModes?.length ? trainer.sessionModes : MODES).map((m: string) => <option key={m}>{m}</option>)}
      </select>
      <textarea placeholder="Anything the trainer should know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="focus-ring mt-3 w-full resize-none rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
      <Button className="mt-4 w-full" onClick={book} disabled={booking || !time}>{booking ? "Booking…" : "Book session"}</Button>
    </Modal>
  );
}

function TrainerProfileModal({ open, onClose, trainer, myPurchases, refreshPurchases }: { open: boolean; onClose: () => void; trainer: any; myPurchases: any[]; refreshPurchases: () => void }) {
  const [tab, setTab] = useState<"overview" | "packages" | "videos" | "diet" | "reviews">("overview");
  const [booking, setBooking] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: pkgData, refresh: refreshPkgs } = useApiGet<{ packages: any[] }>(open && trainer ? `/api/trainers/${trainer.id}/packages` : null, [open, trainer?.id]);
  const { data: vidData, refresh: refreshVideos } = useApiGet<{ videos: any[] }>(open && trainer ? `/api/trainers/${trainer.id}/videos` : null, [open, trainer?.id]);
  const { data: dietData } = useApiGet<{ plans: any[] }>(open && trainer ? `/api/trainers/${trainer.id}/diet-plans` : null, [open, trainer?.id]);
  const { data: reviewData, refresh: refreshReviews } = useApiGet<{ reviews: any[] }>(open && trainer ? `/api/trainers/${trainer.id}/reviews` : null, [open, trainer?.id]);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [purchasingPkg, setPurchasingPkg] = useState<any>(null);

  async function purchase(pkg: any) {
    try {
      const res = await apiPost<{ purchase?: any }>(`/api/packages/${pkg.id}/purchase`, {});
      
      const purchaseId = res.purchase?.id || (res as any).id;
      
      if (purchaseId && pkg.price && pkg.price > 0) {
        setPurchasingPkg(pkg);
        const payRes = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetType: "TRAINER_PACKAGE",
            targetId: purchaseId,
            amount: pkg.price,
            method: "CARD"
          })
        });
        
        const payData = await payRes.json();
        if (payData.success) {
          setPaymentSession(payData);
          setShowPayment(true);
          return;
        }
      }
      
      alert("Package purchased! You can now book sessions against it.");
      refreshPurchases();
      refreshPkgs();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function submitReview() {
    if (!myRating) return alert("Pick a star rating first.");
    setSubmittingReview(true);
    try {
      await apiPost(`/api/trainers/${trainer.id}/reviews`, { rating: myRating, comment: myComment || undefined });
      setMyComment("");
      refreshReviews();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (!trainer) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "packages" as const, label: "Packages" },
    { id: "videos" as const, label: "Videos" },
    { id: "diet" as const, label: "Diet Plans" },
    { id: "reviews" as const, label: "Reviews" },
  ];

  return (
    <>
      <Modal open={open} onClose={onClose} title={trainer.name} subtitle={`${trainer.sport} · ${trainer.area}`} width="lg">
      <div className="flex items-center justify-between">
        <Stars value={trainer.rating} />
        <span className="text-xs text-ink-faint">{trainer.reviewCount} reviews · {trainer.students} students</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-court-line">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`focus-ring -mb-px border-b-2 px-3 py-2 text-xs font-medium ${tab === t.id ? "border-volt text-volt" : "border-transparent text-ink-muted"}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-4 max-h-96 overflow-y-auto">
        {tab === "overview" && (
          <div className="space-y-3">
            {trainer.bio && <p className="text-sm text-ink-muted">{trainer.bio}</p>}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p className="flex items-center gap-1.5 text-ink-muted"><Award size={12} className="text-ink-faint" /> {trainer.experience}</p>
              {trainer.responseTime && <p className="flex items-center gap-1.5 text-ink-muted"><Clock size={12} className="text-ink-faint" /> {trainer.responseTime}</p>}
              {!!trainer.languages?.length && <p className="flex items-center gap-1.5 text-ink-muted"><Globe size={12} className="text-ink-faint" /> {trainer.languages.join(", ")}</p>}
              <p className="flex items-center gap-1.5 text-ink-muted"><MapPin size={12} className="text-ink-faint" /> {trainer.area}</p>
            </div>
            {!!trainer.specializations?.length && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Specializations</p>
                <div className="flex flex-wrap gap-1.5">{trainer.specializations.map((s: string) => <Badge key={s} tone="volt">{s}</Badge>)}</div>
              </div>
            )}
            {!!trainer.certifications?.length && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Certifications</p>
                <div className="flex flex-wrap gap-1.5">{trainer.certifications.map((c: string) => <Badge key={c} tone="muted">{c}</Badge>)}</div>
              </div>
            )}
            {!!trainer.sessionModes?.length && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Session modes</p>
                <div className="flex flex-wrap gap-1.5">{trainer.sessionModes.map((m: string) => <Badge key={m} tone="whistle">{m}</Badge>)}</div>
              </div>
            )}
          </div>
        )}

        {tab === "packages" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(pkgData?.packages ?? []).map((p: any) => (
              <Card key={p.id} className="p-4">
                <h4 className="text-sm font-semibold">{p.name}</h4>
                {p.description && <p className="mt-1 text-xs text-ink-faint">{p.description}</p>}
                <p className="mt-2 text-xs text-ink-muted">{p.sessionCount} sessions · {p.validityDays} days · {p.mode}</p>
                <div className="mt-3 flex items-center justify-between border-t border-court-line pt-3">
                  <span className="font-display text-base">₹{p.price}</span>
                  <Button size="sm" onClick={() => purchase(p)}>Buy</Button>
                </div>
              </Card>
            ))}
            {(pkgData?.packages ?? []).length === 0 && <p className="text-sm text-ink-faint">No packages available yet — you can still book a one-off session below.</p>}
          </div>
        )}

        {tab === "videos" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(vidData?.videos ?? []).map((v: any) => (
              <Card key={v.id} className="p-4">
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-volt/10 text-volt">{v.locked ? <Lock size={14} /> : <PlayCircle size={16} />}</span>
                  <div className="flex gap-1.5">
                    {v.myProgress?.completed && <Badge tone="volt">Watched</Badge>}
                    {v.isPremium && <Badge tone="whistle">Premium</Badge>}
                  </div>
                </div>
                <h4 className="mt-2 text-sm font-semibold">{v.title}</h4>
                {v.locked ? (
                  <p className="mt-1 text-xs text-ink-faint">Buy a package to unlock</p>
                ) : (
                  <>
                    <a href={v.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-volt hover:underline">{v.url}</a>
                    {!v.myProgress?.completed && <MarkVideoWatchedButton videoId={v.id} onMarked={refreshVideos} />}
                  </>
                )}
              </Card>
            ))}
            {(vidData?.videos ?? []).length === 0 && <p className="text-sm text-ink-faint">No videos yet.</p>}
          </div>
        )}

        {tab === "diet" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(dietData?.plans ?? []).map((p: any) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-whistle/10 text-whistle">{p.locked ? <Lock size={14} /> : <Apple size={16} />}</span>
                  <Badge tone="muted">{p.goal}</Badge>
                </div>
                <h4 className="mt-2 text-sm font-semibold">{p.title}</h4>
                <p className="mt-1 text-xs text-ink-muted">{p.locked ? "Buy a package to unlock" : p.description}</p>
              </Card>
            ))}
            {(dietData?.plans ?? []).length === 0 && <p className="text-sm text-ink-faint">No diet plans yet.</p>}
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-3">
            <Card className="p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-ink-faint">Leave a review</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setMyRating(n)} className="focus-ring"><Star size={18} className={n <= myRating ? "text-whistle" : "text-ink-faint"} fill={n <= myRating ? "currentColor" : "none"} /></button>
                ))}
              </div>
              <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="How was your experience?" rows={2} className="focus-ring mt-2 w-full resize-none rounded-lg border border-court-line bg-court px-3 py-2 text-xs" />
              <Button size="sm" className="mt-2" onClick={submitReview} disabled={submittingReview}>Submit</Button>
            </Card>
            {(reviewData?.reviews ?? []).map((r: any) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.userName}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-1.5 text-xs text-ink-muted">{r.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-court-line pt-4">
        <span className="font-display text-lg tracking-wide">{trainer.price}</span>
        <Button onClick={() => setBooking(true)}><Calendar size={14} /> Book a session</Button>
      </div>

      <BookSessionModal open={booking} onClose={() => setBooking(false)} trainer={trainer} myPurchases={myPurchases} onBooked={refreshPurchases} />
    </Modal>
    
    {showPayment && paymentSession && (
      <DemoPaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)}
        onSuccess={(txId) => {
          setShowPayment(false);
          alert("Package purchased! You can now book sessions against it.");
          refreshPurchases();
          refreshPkgs();
        }}
        sessionToken={paymentSession.sessionToken}
        idempotencyKey={paymentSession.idempotencyKey}
        expiresAt={paymentSession.expiresAt}
        amount={purchasingPkg?.price ?? 0}
        upiLink={paymentSession.upiLink}
      />
    )}
  </>
  );
}

function RescheduleProposeModal({ open, onClose, session, onDone }: { open: boolean; onClose: () => void; session: any; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  async function propose() {
    if (!date || !time) return alert("Pick a new date and time.");
    setSending(true);
    try {
      await apiPost(`/api/sessions/${session.id}/reschedule`, { proposedDate: date, proposedTime: time, reason: reason || undefined });
      onDone();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="PROPOSE NEW TIME" subtitle={session?.trainerName}>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
      </div>
      <input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} className="focus-ring mt-3 w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
      <Button className="mt-4 w-full" onClick={propose} disabled={sending}>{sending ? "Sending…" : "Propose new time"}</Button>
    </Modal>
  );
}

function MySessionsPanel() {
  const { data, refresh } = useApiGet<{ sessions: any[] }>("/api/my-sessions");
  const sessions = (data?.sessions ?? []).filter((s: any) => s.status === "SCHEDULED");
  const [rescheduling, setRescheduling] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(id: string, approve: boolean) {
    setBusyId(id);
    try {
      await apiPatch(`/api/sessions/${id}/reschedule`, { approve });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (sessions.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-display text-sm tracking-wide">MY UPCOMING SESSIONS</h3>
      <div className="space-y-2.5">
        {sessions.map((s: any) => (
          <div key={s.id} className="rounded-xl border border-court-line p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{s.trainerName}</p>
              <Badge tone="volt">{s.mode}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><Calendar size={12} /> {s.date} · {s.time}</p>

            {s.rescheduleStatus === "PENDING" && s.rescheduleByUserId === s.studentId ? (
              <p className="mt-2 text-xs text-whistle">Waiting on trainer to respond to your proposed time…</p>
            ) : s.rescheduleStatus === "PENDING" ? (
              <div className="mt-2 rounded-lg border border-whistle/40 bg-whistle/10 p-2.5">
                <p className="text-xs font-semibold text-whistle">Trainer proposed: {s.proposedDate} at {s.proposedTime}</p>
                <div className="mt-1.5 flex gap-2">
                  <Button size="sm" disabled={busyId === s.id} onClick={() => respond(s.id, true)}>Accept</Button>
                  <Button size="sm" variant="outline" disabled={busyId === s.id} onClick={() => respond(s.id, false)}>Decline</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setRescheduling(s)} className="focus-ring mt-2 text-xs font-medium text-volt hover:underline">Request reschedule</button>
            )}
          </div>
        ))}
      </div>
      <RescheduleProposeModal open={!!rescheduling} onClose={() => setRescheduling(null)} session={rescheduling} onDone={refresh} />
    </Card>
  );
}

function BrowseTrainersView() {
  const [tab, setTab] = useState<"trainers" | "academies">("trainers");
  const { data: trainerData, loading: tLoading } = useApiGet<{ trainers: any[] }>(tab === "trainers" ? "/api/trainers" : null, [tab]);
  const { data: academyData, loading: aLoading } = useApiGet<{ academies: any[] }>(tab === "academies" ? "/api/academies" : null, [tab]);
  const trainers = trainerData?.trainers ?? [];
  const academies = academyData?.academies ?? [];
  const [inquiryTarget, setInquiryTarget] = useState<any | null>(null);
  const [profileTarget, setProfileTarget] = useState<any | null>(null);
  const { data: purchaseData, refresh: refreshPurchases } = useApiGet<{ purchases: any[] }>("/api/my-packages");

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <MySessionsPanel />

      <div className="mt-6 flex gap-2">
        <button onClick={() => setTab("trainers")} className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-medium ${tab === "trainers" ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>Trainers</button>
        <button onClick={() => setTab("academies")} className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-medium ${tab === "academies" ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>Academies</button>
      </div>

      {tab === "trainers" ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {tLoading && <p className="text-sm text-ink-faint">Loading…</p>}
          {trainers.map((t: any) => (
            <Card key={t.id} hover glow className="p-6">
              <button onClick={() => setProfileTarget(t)} className="focus-ring block w-full text-left">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-volt/15 text-sm font-bold text-volt">
                      {t.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (t.name ?? "?").split(" ").map((n: string) => n[0]).join("")
                      )}
                    </span>
                    <div>
                      <h3 className="font-display text-base tracking-wide">{(t.name ?? "").toUpperCase()}</h3>
                      <p className="text-xs text-ink-faint">{t.experience}</p>
                    </div>
                  </div>
                  <Stars value={t.rating} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="volt">{t.sport}</Badge>
                  {t.tag && <Badge tone="muted">{t.tag}</Badge>}
                  {t.sessionModes?.includes("Online") && <Badge tone="whistle">Online available</Badge>}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5"><MapPin size={12} className="text-ink-faint" /> {t.area}</span>
                  <span className="flex items-center gap-1.5"><Users size={12} className="text-ink-faint" /> {t.students} students</span>
                </div>
              </button>
              <div className="mt-5 flex items-center justify-between border-t border-court-line pt-4">
                <span className="font-display text-base tracking-wide text-ink">{t.price}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setInquiryTarget(t)}>Inquire</Button>
                  <Button size="sm" onClick={() => setProfileTarget(t)}>View profile</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {aLoading && <p className="text-sm text-ink-faint">Loading…</p>}
          {academies.map((a: any) => (
            <Card key={a.id} hover glow className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-whistle/10 text-whistle">
                <GraduationCap size={20} />
              </span>
              <h3 className="mt-4 font-display text-base tracking-wide">{a.name.toUpperCase()}</h3>
              <p className="mt-1 text-xs text-ink-faint">{a.area} · Est. {a.established}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.sports.map((s: string) => <Badge key={s} tone="muted">{s}</Badge>)}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-court-line pt-4 text-sm">
                <span className="text-ink-muted">{a.batches} active batches</span>
                <Stars value={a.rating} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <InquiryModal open={!!inquiryTarget} onClose={() => setInquiryTarget(null)} trainer={inquiryTarget} />
      <TrainerProfileModal
        open={!!profileTarget}
        onClose={() => setProfileTarget(null)}
        trainer={profileTarget}
        myPurchases={purchaseData?.purchases ?? []}
        refreshPurchases={refreshPurchases}
      />
    </div>
  );
}

export default function TrainersPage() {
  const { role } = useAuth();
  return (
    <div className="pb-16">
      <Topbar title={role === "trainer" ? "My Academy" : "Trainers & Academies"} />
      {role === "trainer" ? <MyAcademyView /> : <BrowseTrainersView />}
    </div>
  );
}
