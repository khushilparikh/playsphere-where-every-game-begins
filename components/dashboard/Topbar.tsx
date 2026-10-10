"use client";

import { Bell, Search, ChevronDown, Check, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Role, roleMeta } from "@/lib/role";
import { useApiGet } from "@/lib/use-api";
import { apiPatch } from "@/lib/api-client";
import { useNotificationSocket } from "@/lib/socket-client";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";

const roleOrder: Role[] = ["player", "organizer", "venue", "trainer"];

interface Notif { id: string; title: string; detail: string; time: string; read: boolean }

// Task 50, Phase 6: debounced global search across venues, tournaments,
// trainers, teams, and public player profiles — hits GET /api/search.
function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { credentials: "include" })
        .then((res) => res.json())
        .then((body) => setResults(body.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300); // debounce — avoids firing a request on every keystroke
    return () => clearTimeout(timeout);
  }, [query]);

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={containerRef} className="group relative hidden sm:block">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-volt" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search PlaySphere..."
        className="focus-ring w-56 rounded-full border border-court-line bg-court-surface py-2 pl-9 pr-4 text-xs text-ink placeholder:text-ink-faint transition-all duration-200 focus:w-72 focus:border-volt/50 focus:shadow-[0_0_0_4px_rgba(36,82,255,0.1)]"
      />
      {open && query.trim().length >= 2 && (
        <div className="animate-risePop absolute right-0 top-11 w-80 origin-top-right rounded-xl border border-court-line bg-court-surface p-2 shadow-card-hover">
          {loading && <p className="px-2 py-3 text-center text-xs text-ink-faint">Searching…</p>}
          {!loading && results.length === 0 && <p className="px-2 py-3 text-center text-xs text-ink-faint">No matches for &ldquo;{query}&rdquo;</p>}
          {!loading &&
            results.map((r: any) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => goTo(r.href)}
                className="focus-ring flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-court"
              >
                <span>
                  <span className="font-medium text-ink">{r.label}</span>
                  {r.sub && <span className="ml-1.5 text-ink-faint">{r.sub}</span>}
                </span>
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] text-ink-faint">{r.type}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function Topbar({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, role, demoLogin, logout } = useAuth();
  const router = useRouter();
  const { data, refresh } = useApiGet<{ notifications: Notif[] }>("/api/notifications");
  // Task 14/15, Phase 4: the initial list comes from the normal fetch
  // above; useNotificationSocket layers real-time updates on top via the
  // Socket.IO connection already used for live scores, so a new
  // notification shows up (and bumps the badge count) instantly instead
  // of waiting for the next poll or page refresh.
  const notifications = useNotificationSocket(user?.id, data?.notifications ?? []);
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const displayNotifications = notifications.map((n) =>
    locallyRead.has(n.id) ? { ...n, read: true } : n
  );
  const unread = displayNotifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    setLocallyRead((prev) => new Set(prev).add(id));
    try {
      await apiPatch(`/api/notifications/${id}`, { read: true });
      refresh();
    } catch {
      /* non-critical */
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-court-line bg-court/90 px-6 py-4 backdrop-blur shadow-nav lg:pl-6">
      <div>
        <Breadcrumbs />
        <h1 className="font-display text-xl tracking-wide sm:text-2xl">{title.toUpperCase()}</h1>
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch />

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            aria-label="Notifications"
            className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-full border border-court-line text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-volt/40 hover:text-volt hover:shadow-card"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-whistle px-1 text-[10px] font-bold leading-none text-white ring-2 ring-court-surface">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {open && (
            <div className="animate-risePop absolute right-0 top-11 w-80 origin-top-right rounded-xl border border-court-line bg-court-surface p-2 shadow-card-hover">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
                Notifications
              </p>
              {displayNotifications.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-ink-faint">You&apos;re all caught up.</p>
              )}
              {displayNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`block w-full rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-volt-soft ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{n.detail}</p>
                  <p className="mt-1 font-mono text-[10px] text-ink-faint">
                    {new Date(n.time).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="focus-ring flex items-center gap-2.5 rounded-full border border-court-line py-1 pl-1 pr-2.5 transition-all duration-200 hover:border-volt/40 hover:shadow-card"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-volt/15 text-xs font-bold text-volt">
              {(user?.name ?? "?").split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight">{user?.name ?? "Guest"}</span>
              <span className="block text-[10px] leading-tight text-ink-faint">{roleMeta[role].short}</span>
            </span>
            <ChevronDown size={14} className={`text-ink-faint transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="animate-risePop absolute right-0 top-12 w-64 origin-top-right rounded-xl border border-court-line bg-court-surface p-2 shadow-card-hover">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
                Preview as (demo)
              </p>
              {roleOrder.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    demoLogin(r);
                    setProfileOpen(false);
                  }}
                  className={`focus-ring flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                    role === r ? "bg-volt-soft text-volt" : "text-ink-muted hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {roleMeta[r].label}
                  {role === r && <Check size={14} />}
                </button>
              ))}
              <div className="my-1 h-px bg-court-line" />
              <button
                onClick={handleLogout}
                className="focus-ring flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-whistle hover:bg-whistle-soft"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
