"use client";

// Task 48, Phase 6: collapsible sidebar. A small shared context rather
// than prop-drilling, since Sidebar and the dashboard layout's content
// wrapper (which needs matching left padding) are siblings, not
// parent/child — see app/(dashboard)/layout.tsx.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "playsphere:sidebar-collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false, toggle: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>;
}

export function useSidebarCollapse() {
  return useContext(SidebarContext);
}
