"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback, useMemo } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api-client";
import { Role } from "@/lib/role";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  area: string | null;
  role: Role;
  roleLabel: string;
  organizationName: string | null;
  sportsPref: string[];
  memberSince: string;
  matchesPlayed: number;
  tournamentsWon: number;
  sportsPassportLevel: string;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  skillRating: number;
  availability: string | null;
  dominantHand: string | null;
  languages: string[];
  experienceLevel: string | null;
  xp: number;
  notifyEmail: boolean;
  notifyBooking: boolean;
  notifyTournament: boolean;
  notifyCommunity: boolean;
  profileVisibility: string;
  followedTags: string[];
  totpEnabled: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, code?: string) => Promise<AuthUser>;
  register: (payload: Record<string, unknown>) => Promise<AuthUser>;
  updateProfile: (payload: Record<string, unknown>) => Promise<AuthUser>;
  demoLogin: (role: Role) => Promise<AuthUser | void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: "player",
  loading: true,
  refresh: async () => {},
  login: async () => { throw new Error("AuthProvider not mounted"); },
  register: async () => { throw new Error("AuthProvider not mounted"); },
  updateProfile: async () => { throw new Error("AuthProvider not mounted"); },
  demoLogin: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<{ user: AuthUser | null }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const lastRefreshRef = useRef(0);
  const throttledRefresh = useCallback(() => {
    const now = Date.now();
    // Re-check the session on refocus, but not more than once every 20s —
    // switching between an editor and the browser fires a `focus` event
    // every single time, and re-fetching (plus the resulting re-render of
    // every component reading useAuth()) on each one is wasted work that
    // can make the UI feel briefly unresponsive right when you click
    // something after tabbing back in.
    if (now - lastRefreshRef.current < 20000) return;
    lastRefreshRef.current = now;
    refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    lastRefreshRef.current = Date.now();

    // If the person logs in as someone else (or logs out) in another tab,
    // this tab's cookie changes too (cookies are per-browser, not per-tab)
    // but React state here has no way to know that on its own. Without
    // this, a background tab can keep showing a stale user/role forever
    // while its API calls silently start using the new session — exactly
    // the "topbar says Player but the server says Admin" bug. Throttled
    // above so it doesn't fire on every single alt-tab.
    function onFocus() {
      throttledRefresh();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") throttledRefresh();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, throttledRefresh]);

  // Task 47, Phase 6: `code` is the TOTP code for accounts with 2FA
  // enabled. Uses a raw fetch (not apiPost) because the "enter your 2FA
  // code" response is a 401 with a distinct `requires2FA` flag rather
  // than a plain error — apiPost's generic throw-on-!ok would otherwise
  // swallow that signal into an unhelpful "Request failed (401)".
  const login = useCallback(async (email: string, password: string, code?: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, code }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (body?.requires2FA) {
        const err = new Error("2FA code required") as Error & { requires2FA?: boolean };
        err.requires2FA = true;
        throw err;
      }
      throw new Error(body?.error || `Request failed (${res.status})`);
    }
    setUser(body.user);
    return body.user as AuthUser;
  }, []);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    const data = await apiPost<{ user: AuthUser }>("/api/auth/register", payload);
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (payload: Record<string, unknown>) => {
    const data = await apiPatch<{ user: AuthUser }>("/api/auth/me", payload);
    setUser(data.user);
    return data.user;
  }, []);

  // Logs into one of the 4 seeded demo accounts — powers the "Continue as"
  // (login page) and "Preview as" (topbar) shortcuts. See prisma/seed.ts.
  const demoLogin = useCallback(async (role: Role) => {
    try {
      const data = await apiPost<{ user: AuthUser }>("/api/auth/demo-login", { role });
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error(err);
      alert(
        (err as Error).message ||
          "Could not switch role. Make sure the backend is running and the database has been seeded (npx prisma db seed)."
      );
    }
  }, []);

  const logout = useCallback(async () => {
    await apiPost("/api/auth/logout");
    setUser(null);
  }, []);

  const role: Role = user?.role ?? "player";

  const value = useMemo(
    () => ({ user, role, loading, refresh, login, register, updateProfile, demoLogin, logout }),
    [user, role, loading, refresh, login, register, updateProfile, demoLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
