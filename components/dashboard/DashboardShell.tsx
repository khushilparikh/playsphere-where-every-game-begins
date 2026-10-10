"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider, useSidebarCollapse } from "@/components/providers/SidebarProvider";

function ContentArea({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarCollapse();
  return <div className={collapsed ? "lg:pl-20" : "lg:pl-64"}>{children}</div>;
}

// Task 48, Phase 6: wraps Sidebar + page content in one SidebarProvider so
// both can react to the same collapsed state — Sidebar needs it for its
// own width, this wrapper needs it for matching left padding on the
// content area. Split out from layout.tsx because that file is a Server
// Component and can't use hooks directly.
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar />
      <ContentArea>{children}</ContentArea>
    </SidebarProvider>
  );
}
