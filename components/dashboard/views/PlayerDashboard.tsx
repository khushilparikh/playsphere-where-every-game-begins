"use client";

import Link from "next/link";
import { Trophy, Users, CalendarClock, Flame, ArrowUpRight, MapPinned } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { LinkButton } from "@/components/ui/Button";
import type { AuthUser } from "@/components/providers/AuthProvider";

interface Props {
  user: AuthUser;
  data: {
    liveMatches: any[];
    tournamentsOpen: any[];
    nearbyVenues: any[];
    feed: any[];
  };
  onChange?: () => void;
}

export function PlayerDashboard({ user, data }: Props) {
  const { liveMatches, tournamentsOpen, nearbyVenues, feed } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      {/* Welcome */}
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-court-line bg-gradient-to-br from-volt-soft via-court-surface to-whistle-soft/60 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-volt">Welcome back</p>
          <h2 className="mt-1 font-display text-2xl tracking-wide">{user.name.toUpperCase()}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {user.roleLabel} · {user.area || "Ahmedabad"}
          </p>
        </div>
        <div className="flex gap-3">
          <LinkButton href="/venues" size="sm">Book a venue</LinkButton>
          <LinkButton href="/tournaments" variant="outline" size="sm">Join a tournament</LinkButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Matches played" value={user.matchesPlayed} icon={<Flame size={16} />} accent="whistle" />
        <StatCard label="Tournaments won" value={user.tournamentsWon} icon={<Trophy size={16} />} />
        <StatCard label="Sports passport" value={user.sportsPassportLevel} icon={<Users size={16} />} accent="blue" />
        <StatCard label="Member since" value={user.memberSince} icon={<CalendarClock size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live matches */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">LIVE &amp; UPCOMING</h3>
            <Link href="/live-scores" className="flex items-center gap-1 text-xs text-volt hover:underline">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {liveMatches.length === 0 && <p className="text-sm text-ink-faint">No matches yet.</p>}
            {liveMatches.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-court-line px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${m.status === "LIVE" ? "animate-pulseDot bg-whistle" : "bg-ink-faint"}`} />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {m.teamA} <span className="text-ink-faint">vs</span> {m.teamB}
                    </p>
                    <p className="text-xs text-ink-faint">{m.sport} · {m.venue || "TBD"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-volt">{m.scoreA} {m.scoreB !== "-" && `– ${m.scoreB}`}</p>
                  <p className="text-xs text-ink-faint">{m.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Profile shortcut */}
        <Card className="p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide">MY PROFILE</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volt/10 text-volt">
                <MapPinned size={15} />
              </span>
              <div>
                <p className="text-sm font-medium">{user.area || "Set your area"}</p>
                <p className="text-xs text-ink-faint">Home location</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-whistle/10 text-whistle">
                <Trophy size={15} />
              </span>
              <div>
                <p className="text-sm font-medium">{user.sportsPassportLevel} Passport</p>
                <p className="text-xs text-ink-faint">{user.tournamentsWon} tournaments won</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-spark/10 text-spark">
                <Users size={15} />
              </span>
              <div>
                <p className="text-sm font-medium">{user.sportsPref.join(", ") || "No sports set"}</p>
                <p className="text-xs text-ink-faint">Preferred sports</p>
              </div>
            </div>
          </div>
          <LinkButton href="/profile" variant="outline" size="sm" className="mt-6 w-full">
            View full profile
          </LinkButton>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">TOURNAMENTS OPEN</h3>
            <Link href="/tournaments" className="text-xs text-volt hover:underline">See all</Link>
          </div>
          <div className="space-y-4">
            {tournamentsOpen.length === 0 && <p className="text-sm text-ink-faint">None open right now.</p>}
            {tournamentsOpen.map((t) => (
              <div key={t.id}>
                <p className="text-sm font-medium">{t.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge tone="volt">{t.sport}</Badge>
                  <span className="text-xs text-ink-faint">{t.teamsRegistered}/{t.teamsCap} teams</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">NEARBY VENUES</h3>
            <Link href="/venues" className="text-xs text-volt hover:underline">See all</Link>
          </div>
          <div className="space-y-4">
            {nearbyVenues.length === 0 && <p className="text-sm text-ink-faint">No venues listed yet.</p>}
            {nearbyVenues.map((v) => (
              <div key={v.id}>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="mt-1 text-xs text-ink-faint">{v.area} · ₹{v.pricePerHour}/hr · ★ {v.rating}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">FROM THE FEED</h3>
            <Link href="/community" className="text-xs text-volt hover:underline">See all</Link>
          </div>
          <div className="space-y-4">
            {feed.length === 0 && <p className="text-sm text-ink-faint">No posts yet.</p>}
            {feed.map((p) => (
              <div key={p.id}>
                <p className="text-sm font-medium">{p.author}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-faint">{p.content}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
