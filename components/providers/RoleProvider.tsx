"use client";

// Backward-compatible shim: every existing component (Sidebar, Topbar,
// Login, etc.) imports `useRole` / `RoleProvider` from this file. Under the
// hood it now delegates to the real, backend-backed AuthProvider — so
// `setRole(role)` performs a real demo-account login (see AuthProvider.tsx
// and prisma/seed.ts) instead of just writing to localStorage.
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { Role } from "@/lib/role";

export function RoleProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function useRole(): { role: Role; setRole: (role: Role) => void } {
  const { role, demoLogin } = useAuth();
  return { role, setRole: (r: Role) => void demoLogin(r) };
}
