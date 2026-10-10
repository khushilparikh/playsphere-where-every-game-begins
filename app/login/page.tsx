"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap, Mail, Lock, User, Trophy, Building2, Dumbbell, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { Role } from "@/lib/role";

const roles: { id: Role; label: string; icon: typeof User }[] = [
  { id: "player", label: "Player", icon: User },
  { id: "organizer", label: "Organizer", icon: Trophy },
  { id: "venue", label: "Venue Owner", icon: Building2 },
  { id: "trainer", label: "Trainer", icon: Dumbbell },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, needsCode ? code : undefined);
      router.push("/dashboard");
    } catch (err) {
      // Task 47, Phase 6: switches to the "enter your 2FA code" step
      // instead of showing an error, when the account has 2FA enabled.
      if ((err as any)?.requires2FA) {
        setNeedsCode(true);
        setError(null);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(role: Role) {
    setError(null);
    setDemoLoading(role);
    try {
      const user = await demoLogin(role);
      if (user) router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt text-white">
            <Zap size={18} strokeWidth={2.5} fill="currentColor" />
          </span>
          <span className="font-display text-xl tracking-wide">PLAYSPHERE</span>
        </Link>

        <div className="rounded-2xl border border-court-line bg-court-surface/90 p-8 shadow-card backdrop-blur-xl">
          <h1 className="font-display text-2xl tracking-wide">WELCOME BACK</h1>
          <p className="mt-2 text-sm text-ink-muted">Log in to book venues, join tournaments and track live scores.</p>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-ink-faint">
              Quick demo login
            </label>
            <div className="grid grid-cols-4 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleDemo(r.id)}
                  disabled={demoLoading !== null}
                  title={`${r.label} — demo account`}
                  className="focus-ring flex flex-col items-center gap-1.5 rounded-xl border border-court-line p-2.5 text-ink-muted transition-all duration-200 hover:border-volt/40 hover:text-volt disabled:opacity-50"
                >
                  <r.icon size={16} />
                  <span className="text-[10px] font-medium leading-tight">
                    {demoLoading === r.id ? "…" : r.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">
              Uses the seeded demo accounts from <code>prisma/seed.ts</code> — no password needed.
            </p>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-court-line" />
            <span className="text-xs text-ink-faint">OR LOG IN MANUALLY</span>
            <span className="h-px flex-1 bg-court-line" />
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-10 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Password
                </label>
                <a href="#" className="text-xs text-volt hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  disabled={needsCode}
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-10 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50 disabled:opacity-60"
                />
              </div>
            </div>

            {needsCode && (
              <div>
                <label htmlFor="code" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-faint">
                  Authenticator code
                </label>
                <input
                  id="code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  className="focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-3 text-center text-lg tracking-[0.4em] text-ink placeholder:tracking-normal placeholder:text-ink-faint focus:border-volt/50"
                />
                <p className="mt-1.5 text-xs text-ink-faint">This account has two-factor authentication enabled — enter the 6-digit code from your authenticator app.</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-whistle/30 bg-whistle-soft px-3 py-2.5 text-xs text-whistle">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="md">
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted">
            New to PlaySphere?{" "}
            <Link href="/register" className="text-volt hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
