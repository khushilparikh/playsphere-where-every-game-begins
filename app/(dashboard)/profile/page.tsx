"use client";

import { useRef, useState } from "react";
import {
  Trophy, Flame, MapPin, CalendarClock, Settings, Shield, Building2, ShieldCheck,
  GraduationCap, Users, Camera, Award, Zap, Bell, Lock, Download, Trash2, History,
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QrCode } from "@/components/ui/QrCode";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost } from "@/lib/api-client";
import { sports } from "@/lib/mock-data";
import { readAndCompressImage, validateImageFile } from "@/lib/image-compress";

const BADGE_ICONS: Record<string, any> = { Flag: Trophy, Flame, Trophy, Users, MapPin, MessageSquare: Users };
const levelTone: Record<string, "volt" | "whistle" | "blue" | "muted"> = {
  Bronze: "muted", Silver: "blue", Gold: "whistle", Platinum: "volt", Diamond: "volt",
};

function ImagePicker({ value, onChange, shape = "circle", label }: { value: string | null; onChange: (v: string) => void; shape?: "circle" | "banner"; label: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) return alert(err);
    try {
      onChange(await readAndCompressImage(file, shape === "banner" ? 1400 : 500));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`focus-ring group relative overflow-hidden border border-dashed border-court-line bg-court text-ink-faint hover:border-volt/50 ${shape === "circle" ? "h-20 w-20 rounded-2xl" : "h-24 w-full rounded-xl"}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[10px]">
            <Camera size={16} /> {label}
          </span>
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-ink/40 text-white group-hover:flex">
          <Camera size={16} />
        </span>
      </button>
    </div>
  );
}

function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, role, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "", phone: user?.phone ?? "", area: user?.area ?? "",
    organizationName: user?.organizationName ?? "", bio: user?.bio ?? "",
    availability: user?.availability ?? "", dominantHand: user?.dominantHand ?? "",
    experienceLevel: user?.experienceLevel ?? "", languages: (user?.languages ?? []).join(", "),
    skillRating: user?.skillRating ?? 5,
  });
  const [avatar, setAvatar] = useState(user?.avatar ?? null);
  const [banner, setBanner] = useState(user?.banner ?? null);
  const [selectedSports, setSelectedSports] = useState<string[]>(user?.sportsPref ?? []);
  const [saving, setSaving] = useState(false);

  function toggleSport(s: string) {
    setSelectedSports((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        area: form.area,
        organizationName: role === "organizer" ? form.organizationName : undefined,
        sportsPref: role === "player" ? selectedSports : undefined,
        avatar: avatar ?? undefined,
        banner: banner ?? undefined,
        bio: form.bio,
        availability: form.availability,
        dominantHand: form.dominantHand,
        experienceLevel: form.experienceLevel,
        languages: form.languages.split(",").map((l) => l.trim()).filter(Boolean),
        skillRating: Number(form.skillRating),
      });
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="EDIT PROFILE" width="lg">
      <div className="grid gap-4">
        <ImagePicker value={banner} onChange={setBanner} shape="banner" label="Add cover banner" />
        <div className="flex items-center gap-4">
          <ImagePicker value={avatar} onChange={setAvatar} shape="circle" label="Photo" />
          <p className="text-xs text-ink-faint">Square photos work best. Compressed automatically before upload.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
          <input placeholder="Area (e.g. Satellite, Ahmedabad)" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm sm:col-span-2" />
        </div>

        <textarea
          placeholder="Short bio — what do you play, what are you looking for?"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={2}
          className="focus-ring w-full resize-none rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm placeholder:text-ink-faint"
        />

        {role === "organizer" && (
          <input placeholder="Organization name" value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
        )}

        {role === "player" && (
          <>
            <div>
              <p className="mb-2 text-xs text-ink-faint">Sports you play</p>
              <div className="flex flex-wrap gap-2">
                {sports.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSport(s)} className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium ${selectedSports.includes(s) ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input placeholder="Availability (e.g. Weekday evenings)" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
              <select value={form.dominantHand} onChange={(e) => setForm({ ...form, dominantHand: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                <option value="">Dominant hand / foot</option>
                <option>Right</option>
                <option>Left</option>
                <option>Both</option>
              </select>
              <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
                <option value="">Experience level</option>
                <option>Beginner</option>
                <option>Club level</option>
                <option>District level</option>
                <option>State level</option>
                <option>National level</option>
              </select>
              <input placeholder="Languages (comma separated)" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-ink-faint">
                <span>Self-rated skill</span>
                <span className="font-semibold text-volt">{form.skillRating}/10</span>
              </div>
              <input type="range" min={0} max={10} value={form.skillRating} onChange={(e) => setForm({ ...form, skillRating: Number(e.target.value) })} className="w-full accent-volt" />
            </div>
          </>
        )}
      </div>
      <Button className="mt-5 w-full" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </Modal>
  );
}

function BadgesCard() {
  const { data } = useApiGet<{ badges: any[] }>("/api/badges");
  const badges = data?.badges ?? [];
  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><Award size={16} className="text-volt" /> BADGES</h3>
      {badges.length === 0 && <p className="mt-3 text-sm text-ink-faint">No badges yet — play a match, book a venue, or post in the community to start earning them.</p>}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {badges.map((b: any) => {
          const Icon = BADGE_ICONS[b.icon] ?? Award;
          return (
            <div key={b.code} className="rounded-xl border border-court-line p-3 text-center" title={b.description}>
              <Icon size={18} className="mx-auto text-volt" />
              <p className="mt-1.5 text-xs font-semibold">{b.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PlayerDetails() {
  const { user } = useAuth();
  const { data } = useApiGet<{ teams: any[] }>("/api/teams");
  const teams = data?.teams ?? [];
  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><Users size={16} className="text-volt" /> PLAYER DETAILS</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-court px-3 py-3">
          <p className="font-display text-lg text-volt">{user?.sportsPassportLevel}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Sports Passport</p>
        </div>
        <div className="rounded-lg bg-court px-3 py-3">
          <p className="font-display text-lg text-ink">{teams.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Teams joined</p>
        </div>
      </div>
      {(user?.availability || user?.dominantHand || user?.experienceLevel || user?.languages?.length) && (
        <div className="mt-4 space-y-1.5 text-xs">
          {user?.availability && <p className="flex justify-between"><span className="text-ink-faint">Availability</span><span className="font-medium">{user.availability}</span></p>}
          {user?.dominantHand && <p className="flex justify-between"><span className="text-ink-faint">Dominant hand/foot</span><span className="font-medium">{user.dominantHand}</span></p>}
          {user?.experienceLevel && <p className="flex justify-between"><span className="text-ink-faint">Experience</span><span className="font-medium">{user.experienceLevel}</span></p>}
          {!!user?.languages?.length && <p className="flex justify-between"><span className="text-ink-faint">Languages</span><span className="font-medium">{user.languages.join(", ")}</span></p>}
          <p className="flex justify-between"><span className="text-ink-faint">Skill rating</span><span className="font-medium">{user?.skillRating}/10</span></p>
        </div>
      )}
      {teams.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {teams.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-xs">
              <span className="font-medium">{t.name}</span>
              <Badge tone="muted">{t.sport}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function OrganizerDetails() {
  const { user } = useAuth();
  const { data } = useApiGet<{ tournaments: any[] }>("/api/tournaments?mine=true");
  const tournaments = data?.tournaments ?? [];
  const revenue = tournaments.reduce((sum: number, t: any) => sum + (t.revenueCollected ?? 0), 0);
  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><Trophy size={16} className="text-volt" /> ORGANIZER DETAILS</h3>
      {user?.organizationName && <p className="mt-1 text-xs text-ink-faint">{user.organizationName}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-court px-3 py-3">
          <p className="font-display text-lg text-ink">{tournaments.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Tournaments run</p>
        </div>
        <div className="rounded-lg bg-court px-3 py-3">
          <p className="font-display text-lg text-volt">₹{revenue.toLocaleString("en-IN")}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Total collected</p>
        </div>
      </div>
    </Card>
  );
}

function VenueOwnerDetails() {
  const { data } = useApiGet<{ venues: any[] }>("/api/venues?mine=true");
  const venues = data?.venues ?? [];
  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><Building2 size={16} className="text-volt" /> VENUE OWNER DETAILS</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-court px-3 py-3">
          <p className="font-display text-lg text-ink">{venues.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Venues listed</p>
        </div>
        <div className="rounded-lg bg-court px-3 py-3">
          <p className="font-display text-lg text-volt">{venues.filter((v: any) => v.status === "Active").length}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Active</p>
        </div>
      </div>
      {venues.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {venues.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-xs">
              <span className="font-medium">{v.name}</span>
              <Badge tone={v.status === "Active" ? "volt" : "whistle"}>{v.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TrainerDetails() {
  const { data } = useApiGet<{ trainers: any[] }>("/api/trainers?mine=true");
  const trainer = data?.trainers?.[0];
  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><GraduationCap size={16} className="text-volt" /> TRAINER DETAILS</h3>
      {!trainer && <p className="mt-3 text-sm text-ink-faint">No trainer profile set up yet — visit My Academy to create one.</p>}
      {trainer && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex justify-between"><span className="text-ink-faint">Sport</span><span className="font-medium">{trainer.sport}</span></p>
          <p className="flex justify-between"><span className="text-ink-faint">Experience</span><span className="font-medium">{trainer.experience}</span></p>
          <p className="flex justify-between"><span className="text-ink-faint">Rate</span><span className="font-medium">{trainer.price}</span></p>
          <p className="flex justify-between"><span className="text-ink-faint">Students</span><span className="font-medium">{trainer.students}</span></p>
          <p className="flex justify-between"><span className="text-ink-faint">Rating</span><span className="font-medium">{trainer.rating || "—"}</span></p>
        </div>
      )}
    </Card>
  );
}

function AdminDetails() {
  const { data } = useApiGet<{ users: any[] }>("/api/admin/users");
  const users = data?.users ?? [];
  const byRole = users.reduce((acc: Record<string, number>, u: any) => {
    acc[u.roleLabel] = (acc[u.roleLabel] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><ShieldCheck size={16} className="text-volt" /> ADMIN DETAILS</h3>
      <p className="mt-1 text-xs text-ink-faint">You manage every profile on PlaySphere from the Admin Console.</p>
      <div className="mt-4 space-y-1.5">
        {Object.entries(byRole).map(([label, count]) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-xs">
            <span className="font-medium">{label}</span>
            <span className="text-ink-faint">{count as number}</span>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => (window.location.href = "/admin")}>
        Open Admin Console
      </Button>
    </Card>
  );
}

function NotificationPrefsCard() {
  const { user, updateProfile } = useAuth();
  const [prefs, setPrefs] = useState({
    notifyEmail: user?.notifyEmail ?? true,
    notifyBooking: user?.notifyBooking ?? true,
    notifyTournament: user?.notifyTournament ?? true,
    notifyCommunity: user?.notifyCommunity ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function toggle(key: keyof typeof prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      await updateProfile(next);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const rows: [keyof typeof prefs, string][] = [
    ["notifyBooking", "Booking updates"],
    ["notifyTournament", "Tournament updates"],
    ["notifyCommunity", "Community activity"],
    ["notifyEmail", "New sign-in / security alerts"],
  ];

  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><Bell size={16} className="text-volt" /> NOTIFICATION PREFERENCES</h3>
      <div className="mt-4 space-y-2.5">
        {rows.map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-court-line px-4 py-2.5">
            <span className="text-sm">{label}</span>
            <input type="checkbox" checked={prefs[key]} disabled={saving} onChange={() => toggle(key)} className="h-4 w-4 accent-volt" />
          </label>
        ))}
      </div>
    </Card>
  );
}

function PrivacyCard() {
  const { user, updateProfile } = useAuth();
  const [visibility, setVisibility] = useState(user?.profileVisibility ?? "public");
  const [saving, setSaving] = useState(false);

  async function set(v: string) {
    setVisibility(v);
    setSaving(true);
    try {
      await updateProfile({ profileVisibility: v });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><Lock size={16} className="text-volt" /> PRIVACY</h3>
      <p className="mt-1 text-xs text-ink-faint">Control whether other players can see your full sports profile.</p>
      <div className="mt-4 flex gap-2">
        {["public", "private"].map((v) => (
          <button key={v} disabled={saving} onClick={() => set(v)} className={`focus-ring flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize ${visibility === v ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}>
            {v}
          </button>
        ))}
      </div>
    </Card>
  );
}

// Task 47, Phase 6: TOTP 2FA setup/disable, Admin-only (see the role
// check on the backend routes). Reuses the QrCode component built for
// Task 24's team invite links.
function TwoFactorCard() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<"idle" | "setup" | "disable">("idle");
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSetup() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiPost<{ otpauthUrl: string }>("/api/auth/2fa/setup", {});
      setOtpauthUrl(res.otpauthUrl);
      setStep("setup");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup() {
    setError(null);
    setBusy(true);
    try {
      await apiPost("/api/auth/2fa/verify", { code });
      setStep("idle");
      setCode("");
      setOtpauthUrl(null);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setError(null);
    setBusy(true);
    try {
      await apiPost("/api/auth/2fa/disable", { password });
      setStep("idle");
      setPassword("");
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><Lock size={16} className="text-volt" /> TWO-FACTOR AUTHENTICATION</h3>
      <p className="mt-1 text-xs text-ink-faint">Adds a code from an authenticator app on top of your password when logging in.</p>

      {error && <p className="mt-3 text-xs text-whistle">{error}</p>}

      {step === "idle" && (
        user?.totpEnabled ? (
          <div className="mt-4 flex items-center justify-between">
            <Badge tone="volt">Enabled</Badge>
            <Button size="sm" variant="outline" onClick={() => setStep("disable")}>Disable</Button>
          </div>
        ) : (
          <Button size="sm" className="mt-4" onClick={startSetup} disabled={busy}>Set up 2FA</Button>
        )
      )}

      {step === "setup" && otpauthUrl && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-ink-faint">Scan this in your authenticator app, then enter the 6-digit code it shows:</p>
          <QrCode value={otpauthUrl} size={140} />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            className="focus-ring mt-3 w-40 rounded-lg border border-court-line bg-court px-3 py-2 text-center text-sm tracking-widest"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={confirmSetup} disabled={busy || code.length < 6}>Confirm</Button>
            <Button size="sm" variant="outline" onClick={() => { setStep("idle"); setOtpauthUrl(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {step === "disable" && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-ink-faint">Enter your password to confirm disabling 2FA:</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="focus-ring w-full max-w-xs rounded-lg border border-court-line bg-court px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={disable} disabled={busy || !password}>Disable 2FA</Button>
            <Button size="sm" variant="outline" onClick={() => { setStep("idle"); setPassword(""); }}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function LoginHistoryCard() {
  const { data } = useApiGet<{ events: any[] }>("/api/auth/login-history");
  const events = data?.events ?? [];
  const { logout } = useAuth();
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Task 45, Phase 6: "log out everywhere" — bumps the user's
  // tokenVersion server-side (see POST /api/auth/logout-all), which
  // invalidates every JWT issued to them, this device included.
  async function logoutEverywhere() {
    if (!confirm("This will sign you out on every device, including this one. Continue?")) return;
    setLoggingOutAll(true);
    try {
      await fetch("/api/auth/logout-all", { method: "POST" });
      await logout();
      window.location.href = "/login";
    } catch {
      setLoggingOutAll(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg tracking-wide"><History size={16} className="text-volt" /> LOGIN HISTORY</h3>
        <button onClick={logoutEverywhere} disabled={loggingOutAll} className="focus-ring text-xs font-medium text-whistle hover:underline">
          {loggingOutAll ? "Signing out…" : "Log out of all devices"}
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {events.length === 0 && <p className="text-sm text-ink-faint">No recorded logins yet.</p>}
        {events.slice(0, 8).map((e: any) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-xs">
            <span className={e.success ? "text-ink" : "text-whistle"}>{e.success ? "Successful login" : "Failed attempt"} · {e.ip ?? "unknown IP"}</span>
            <span className="text-ink-faint">{new Date(e.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DangerZoneCard() {
  const { logout } = useAuth();
  const [confirming, setConfirming] = useState(false);

  async function exportData() {
    const res = await fetch("/api/auth/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playsphere-data-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    try {
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      await logout();
      window.location.href = "/";
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg tracking-wide">DATA & ACCOUNT</h3>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" size="sm" onClick={exportData}><Download size={14} /> Export my data</Button>
        {!confirming ? (
          <Button variant="outline" size="sm" onClick={() => setConfirming(true)}><Trash2 size={14} /> Delete account</Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-whistle">Are you sure? This can&apos;t be undone.</span>
            <Button size="sm" variant="secondary" onClick={deleteAccount}>Yes, delete</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// Task 11, Phase 3: frontend-only completeness calculation — no backend
// change needed, purely derived from the already-loaded `user` object.
// Fields are weighted equally; role-specific fields only count for roles
// where they're actually shown (see EditProfileModal above).
function computeProfileCompleteness(user: any, role: string) {
  const checks: { label: string; done: boolean }[] = [
    { label: "Profile photo", done: !!user.avatar },
    { label: "Bio", done: !!user.bio?.trim() },
    { label: "Phone number", done: !!user.phone?.trim() },
    { label: "Home area", done: !!user.area?.trim() },
  ];

  if (role === "player") {
    checks.push(
      { label: "Sports you play", done: !!user.sportsPref?.length },
      { label: "Availability", done: !!user.availability?.trim() },
      { label: "Languages", done: !!user.languages?.length },
    );
  } else if (role === "organizer" || role === "venue" || role === "trainer") {
    checks.push({ label: "Organization name", done: !!user.organizationName?.trim() });
  }

  const done = checks.filter((c) => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c.done).map((c) => c.label) };
}

function ProfileCompletenessMeter({ user, role }: { user: any; role: string }) {
  const { percent, missing } = computeProfileCompleteness(user, role);
  if (percent === 100) return null; // nothing to nudge once it's complete

  return (
    <div className="mt-6 rounded-xl border border-court-line p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink-muted">Profile completeness</span>
        <span className="font-display tracking-wide text-volt">{percent}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-court-line">
        <div className="h-full rounded-full bg-volt transition-all" style={{ width: `${percent}%` }} />
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-[11px] text-ink-faint">Add {missing.slice(0, 3).join(", ")}{missing.length > 3 ? `, +${missing.length - 3} more` : ""} to complete your profile.</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [editing, setEditing] = useState(false);
  if (!user) return null;

  return (
    <div className="pb-16">
      <Topbar title="Profile" />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <Card className="overflow-hidden p-0">
          <div className="h-28 bg-gradient-to-r from-volt/25 via-spark/15 to-whistle/20">
            {user.banner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.banner} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-court bg-volt/20 font-display text-2xl text-volt">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name.split(" ").map((n) => n[0]).join("")
                  )}
                </span>
                <div className="pb-1">
                  <h1 className="font-display text-2xl tracking-wide">{user.name.toUpperCase()}</h1>
                  <p className="text-sm text-ink-muted">{user.roleLabel}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Settings size={14} /> Edit profile
              </Button>
            </div>

            {user.bio && <p className="mt-4 max-w-xl text-sm text-ink-muted">{user.bio}</p>}

            {role === "player" && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {user.sportsPref.map((s) => <Badge key={s} tone="volt">{s}</Badge>)}
                <Badge tone={levelTone[user.sportsPassportLevel] ?? "muted"}>Sports Passport · {user.sportsPassportLevel}</Badge>
                <Badge tone="muted"><Zap size={11} className="mr-1 inline" />{user.xp} XP</Badge>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Matches played", value: user.matchesPlayed, icon: Flame },
                { label: "Tournaments won", value: user.tournamentsWon, icon: Trophy },
                { label: "Home area", value: (user.area || "Ahmedabad").split(",")[0], icon: MapPin },
                { label: "Member since", value: user.memberSince, icon: CalendarClock },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-court-line p-4">
                  <s.icon size={16} className="text-volt" />
                  <p className="mt-2 font-display text-lg tracking-wide">{s.value}</p>
                  <p className="text-[11px] uppercase tracking-widest text-ink-faint">{s.label}</p>
                </div>
              ))}
            </div>

            <ProfileCompletenessMeter user={user} role={role} />
          </div>
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-display text-lg tracking-wide">ACCOUNT DETAILS</h3>
            <div className="mt-4 space-y-3">
              {[
                ["Email", user.email],
                ["Phone", user.phone || "Not set"],
                ["Area", user.area || "Not set"],
                ...(user.organizationName ? [["Organization", user.organizationName]] : []),
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg border border-court-line px-4 py-3">
                  <span className="text-xs text-ink-faint">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {role === "player" && <PlayerDetails />}
          {role === "organizer" && <OrganizerDetails />}
          {role === "venue" && <VenueOwnerDetails />}
          {role === "trainer" && <TrainerDetails />}
          {role === "admin" && <AdminDetails />}

          {role === "player" && <BadgesCard />}
          <NotificationPrefsCard />
          <PrivacyCard />
          <LoginHistoryCard />
          {role === "admin" && <TwoFactorCard />}
        </div>

        <div className="mt-6">
          <DangerZoneCard />
        </div>
      </div>

      <EditProfileModal open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
