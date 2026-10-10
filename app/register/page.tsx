"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, User, Building2, Trophy, Dumbbell, ShieldCheck, Check, AlertCircle } from "lucide-react";
import { LinkButton, Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { Role } from "@/lib/role";
import { sports } from "@/lib/mock-data";
import { useState } from "react";

const roles: { id: Role; label: string; icon: typeof User; desc: string }[] = [
  { id: "player", label: "Player", icon: User, desc: "Find matches, book venues, join tournaments" },
  { id: "organizer", label: "Organizer", icon: Trophy, desc: "Create and manage tournaments" },
  { id: "venue", label: "Venue Owner", icon: Building2, desc: "List venues and manage bookings" },
  { id: "trainer", label: "Trainer / Academy", icon: Dumbbell, desc: "Reach students and grow your coaching" },
  { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Manage every profile on PlaySphere — requires an access code" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // This local state is intentionally separate from the app's auth/role
  // context — selecting a role here is just filling out a form, not
  // switching who is logged in. The account (and its role) is only created
  // for real once "Create account" is submitted.
  const [role, setRole] = useState<Role>("player");
  const [selectedSports, setSelectedSports] = useState<string[]>(["Cricket"]);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", area: "",
    organizationName: "", venueName: "", venueSports: sports[0],
    trainerSport: sports[0], trainerExperience: "", adminCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSport(s: string) {
    setSelectedSports((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit() {
    setError(null);
    if (!form.name || !form.email || !form.password) {
      setError("Name, email and password are required.");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        area: form.area,
        role,
        sportsPref: selectedSports,
        organizationName: form.organizationName,
        venueName: form.venueName,
        venueSports: form.venueSports,
        trainerSport: form.trainerSport,
        trainerExperience: form.trainerExperience,
        adminCode: form.adminCode,
      });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt text-white">
            <Zap size={18} strokeWidth={2.5} fill="currentColor" />
          </span>
          <span className="font-display text-xl tracking-wide">PLAYSPHERE</span>
        </Link>

        <div className="rounded-2xl border border-court-line bg-court-surface/90 p-8 shadow-card backdrop-blur-xl">
          <h1 className="font-display text-2xl tracking-wide">JOIN THE ECOSYSTEM</h1>
          <p className="mt-2 text-sm text-ink-muted">Tell us who you are so we can set up the right dashboard.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`focus-ring relative rounded-xl border p-4 text-left transition-all duration-200 ${
                  r.id === "admin" ? "col-span-2" : ""
                } ${
                  role === r.id
                    ? "border-volt bg-volt-soft shadow-card"
                    : "border-court-line hover:border-volt/40 hover:bg-volt-soft/40"
                }`}
              >
                {role === r.id && (
                  <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-volt text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                <r.icon size={18} className={role === r.id ? "text-volt" : "text-ink-muted"} />
                <p className="mt-2 text-sm font-semibold">{r.label}</p>
                <p className="mt-0.5 text-xs text-ink-faint">{r.desc}</p>
              </button>
            ))}
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Full name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  type="text"
                  placeholder="Dhruvil Rana"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  type="tel"
                  placeholder="+91 98xxxxxx"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Password
                </label>
                <input
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  type="password"
                  placeholder="At least 6 characters"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                Area in Ahmedabad
              </label>
              <input
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
                type="text"
                placeholder="Satellite, Bopal, Vastrapur..."
                className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
              />
            </div>

            {/* Role-specific fields */}
            {role === "player" && (
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Sports you play
                </label>
                <div className="flex flex-wrap gap-2">
                  {sports.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSport(s)}
                      className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedSports.includes(s)
                          ? "border-volt bg-volt-soft text-volt"
                          : "border-court-line text-ink-muted hover:border-volt/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {role === "organizer" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Club / organization name
                </label>
                <input
                  value={form.organizationName}
                  onChange={(e) => set("organizationName", e.target.value)}
                  type="text"
                  placeholder="Satellite Sports Club"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
              </div>
            )}

            {role === "venue" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                    Venue name
                  </label>
                  <input
                    value={form.venueName}
                    onChange={(e) => set("venueName", e.target.value)}
                    type="text"
                    placeholder="Karnavati Sports Arena"
                    className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                    Sports offered
                  </label>
                  <select
                    value={form.venueSports}
                    onChange={(e) => set("venueSports", e.target.value)}
                    className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink-muted focus:border-volt/50"
                  >
                    {sports.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {role === "trainer" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                    Sport specialization
                  </label>
                  <select
                    value={form.trainerSport}
                    onChange={(e) => set("trainerSport", e.target.value)}
                    className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink-muted focus:border-volt/50"
                  >
                    {sports.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                    Years of experience
                  </label>
                  <input
                    value={form.trainerExperience}
                    onChange={(e) => set("trainerExperience", e.target.value)}
                    type="number"
                    placeholder="5"
                    className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                  />
                </div>
              </div>
            )}

            {role === "admin" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Admin access code
                </label>
                <input
                  value={form.adminCode}
                  onChange={(e) => set("adminCode", e.target.value)}
                  type="password"
                  placeholder="Ask your project lead for this"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
                <p className="mt-1.5 text-xs text-ink-faint">
                  Matches <code className="rounded bg-court px-1 py-0.5">ADMIN_SIGNUP_CODE</code> in the server&apos;s .env file.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-whistle/30 bg-whistle-soft px-3 py-2.5 text-xs text-whistle">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : `Create ${roles.find((r) => r.id === role)?.label} account`}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Already on PlaySphere?{" "}
            <Link href="/login" className="text-volt hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
