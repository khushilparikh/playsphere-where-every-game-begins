"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

// Task 49, Phase 6: auto-derives a breadcrumb trail from the current URL
// segment-by-segment, rather than requiring every page to declare its
// own breadcrumb — a segment like a cuid/id is shown as a shortened,
// non-clickable "Detail" crumb instead of the raw id string.
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  community: "Community",
  players: "Players",
  teams: "Teams",
  tournaments: "Tournaments",
  venues: "Venues",
  "live-scores": "Live Scores",
  "start-match": "Start Match",
  trainers: "Trainers & Academies",
  leaderboard: "Leaderboard",
  profile: "Profile",
  admin: "Admin",
  messages: "Messages",
  join: "Join",
};

function isLikelyId(segment: string) {
  // cuids are 20+ lowercase-alphanumeric chars; also catch shorter opaque tokens/JWTs.
  return segment.length > 12 && /^[a-z0-9._-]+$/i.test(segment);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null; // no trail needed on a top-level page

  let href = "";
  const crumbs = segments.map((seg, i) => {
    href += `/${seg}`;
    const isLast = i === segments.length - 1;
    const label = LABELS[seg] ?? (isLikelyId(seg) ? "Detail" : seg.charAt(0).toUpperCase() + seg.slice(1));
    return { href, label, clickable: !isLikelyId(seg) && !isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-ink-faint">
      <Link href="/dashboard" className="hover:text-ink">Home</Link>
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-1.5">
          <ChevronRight size={12} />
          {c.clickable ? (
            <Link href={c.href} className="hover:text-ink">{c.label}</Link>
          ) : (
            <span className="text-ink-muted">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
