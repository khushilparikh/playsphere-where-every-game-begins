"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Shield,
  Trophy,
  MapPinned,
  Radio,
  GraduationCap,
  UserCircle,
  Settings,
  Zap,
  Building2,
  Award,
  PlayCircle,
  Mail,
  ChevronLeft,
} from "lucide-react";
import { useRole } from "@/components/providers/RoleProvider";
import { useSidebarCollapse } from "@/components/providers/SidebarProvider";
import { roleMeta } from "@/lib/role";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const navByRole: Record<string, NavItem[]> = {
  player: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/community", label: "Community", icon: MessageSquare },
    { href: "/messages", label: "Messages", icon: Mail },
    { href: "/players", label: "Player Finder", icon: Users },
    { href: "/teams", label: "Teams", icon: Shield },
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/venues", label: "Venue Booking", icon: MapPinned },
    { href: "/live-scores", label: "Live Scores", icon: Radio },
    { href: "/start-match", label: "Start Match", icon: PlayCircle },
    { href: "/trainers", label: "Trainers & Academies", icon: GraduationCap },
    { href: "/leaderboard", label: "Leaderboard", icon: Award },
  ],
  organizer: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tournaments", label: "My Tournaments", icon: Trophy },
    { href: "/teams", label: "Registered Teams", icon: Shield },
    { href: "/community", label: "Community", icon: MessageSquare },
    { href: "/messages", label: "Messages", icon: Mail },
    { href: "/venues", label: "Venue Booking", icon: MapPinned },
    { href: "/live-scores", label: "Live Scores", icon: Radio },
    { href: "/start-match", label: "Start Match", icon: PlayCircle },
  ],
  venue: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/venues", label: "My Venues", icon: Building2 },
    { href: "/live-scores", label: "Live Scores", icon: Radio },
    { href: "/start-match", label: "Start Match", icon: PlayCircle },
    { href: "/community", label: "Community", icon: MessageSquare },
    { href: "/messages", label: "Messages", icon: Mail },
  ],
  trainer: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trainers", label: "My Academy", icon: GraduationCap },
    { href: "/live-scores", label: "Live Scores", icon: Radio },
    { href: "/start-match", label: "Start Match", icon: PlayCircle },
    { href: "/community", label: "Community", icon: MessageSquare },
    { href: "/messages", label: "Messages", icon: Mail },
  ],
  admin: [
    { href: "/admin", label: "Admin Console", icon: Settings },
    { href: "/live-scores", label: "Live Scores", icon: Radio },
    { href: "/community", label: "Community", icon: MessageSquare },
    { href: "/messages", label: "Messages", icon: Mail },
  ],
};

const bottomNav: NavItem[] = [{ href: "/profile", label: "Profile", icon: UserCircle }];

function NavGroup({ items, pathname, collapsed }: { items: NavItem[]; pathname: string; collapsed: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const activeEl = itemRefs.current[pathname];
    if (activeEl && containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const rect = activeEl.getBoundingClientRect();
      setIndicator({ top: rect.top - containerTop, height: rect.height });
    } else {
      setIndicator(null);
    }
  }, [pathname, items]);

  return (
    <div ref={containerRef} className="relative space-y-1">
      {indicator && (
        <div
          className="absolute left-0 w-full rounded-xl bg-volt-soft transition-all duration-300 ease-spring"
          style={{ top: indicator.top, height: indicator.height }}
        >
          <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-volt" />
        </div>
      )}
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            title={collapsed ? item.label : undefined}
            ref={(el) => {
              itemRefs.current[item.href] = el;
            }}
            className={`focus-ring group relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              collapsed ? "justify-center" : ""
            } ${active ? "text-volt" : "text-ink-muted hover:text-ink"}`}
          >
            <item.icon size={18} className={active ? "" : "transition-transform duration-200 group-hover:scale-110"} />
            {!collapsed && item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const { collapsed, toggle } = useSidebarCollapse();
  const nav = navByRole[role] ?? navByRole.player;

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-court-line bg-court-surface/90 shadow-nav backdrop-blur transition-all duration-200 lg:flex ${collapsed ? "w-20" : "w-64"}`}>
      <Link href="/" className={`group flex items-center gap-2 border-b border-court-line px-6 py-5 ${collapsed ? "justify-center px-0" : ""}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volt text-white transition-transform duration-300 ease-spring group-hover:rotate-[-8deg] group-hover:scale-110">
          <Zap size={18} strokeWidth={2.5} fill="currentColor" />
        </span>
        {!collapsed && <span className="font-display text-lg tracking-wide">PLAYSPHERE</span>}
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
            {roleMeta[role].short}
          </p>
        )}
        <NavGroup items={nav} pathname={pathname} collapsed={collapsed} />
      </nav>

      <div className="border-t border-court-line px-3 py-3">
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`focus-ring mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink-faint hover:text-ink ${collapsed ? "justify-center" : ""}`}
        >
          <ChevronLeft size={16} className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && "Collapse"}
        </button>
        <NavGroup items={bottomNav} pathname={pathname} collapsed={collapsed} />
      </div>
    </aside>
  );
}
