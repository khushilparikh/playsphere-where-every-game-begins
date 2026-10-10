"use client";

import Link from "next/link";
import { Trophy, Users, Wallet, CheckCircle2, XCircle, PlusCircle, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { apiPatch } from "@/lib/api-client";
import type { AuthUser } from "@/components/providers/AuthProvider";

interface Props {
  user: AuthUser;
  data: {
    tournaments: any[];
    pendingRegistrations: any[];
    totalTeams: number;
    totalRevenue: number;
  };
  onChange?: () => void;
}

export function OrganizerDashboard({ user, data, onChange }: Props) {
  const { tournaments, pendingRegistrations, totalTeams, totalRevenue } = data;

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    try {
      await apiPatch(`/api/registrations/${id}`, { status });
      onChange?.();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-court-line bg-gradient-to-br from-whistle-soft via-court-surface to-volt-soft/60 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-whistle">Organizer console</p>
          <h2 className="mt-1 font-display text-2xl tracking-wide">{user.name.toUpperCase()}</h2>
          <p className="mt-1 text-sm text-ink-muted">{user.organizationName || "Independent organizer"} · {user.area || "Ahmedabad"}</p>
        </div>
        <div className="flex gap-3">
          <LinkButton href="/tournaments" size="sm">
            <PlusCircle size={15} /> Manage tournaments
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active tournaments" value={tournaments.length} icon={<Trophy size={16} />} />
        <StatCard label="Teams registered" value={totalTeams} icon={<Users size={16} />} accent="blue" />
        <StatCard label="Pending approvals" value={pendingRegistrations.length} icon={<CheckCircle2 size={16} />} accent="whistle" />
        <StatCard label="Revenue collected" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={<Wallet size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">MY TOURNAMENTS</h3>
            <Link href="/tournaments" className="flex items-center gap-1 text-xs text-volt hover:underline">
              Manage all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="space-y-4">
            {tournaments.length === 0 && <p className="text-sm text-ink-faint">You haven&apos;t created a tournament yet.</p>}
            {tournaments.map((t) => {
              const pct = Math.round((t.teamsRegistered / t.teamsCap) * 100);
              return (
                <div key={t.id} className="rounded-xl border border-court-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{t.name}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge tone="volt">{t.sport}</Badge>
                        <Badge tone={t.status === "Registration Open" ? "volt" : "muted"}>{t.status}</Badge>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs text-ink-faint">
                      {t.teamsRegistered}/{t.teamsCap} teams
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-court">
                    <div className="h-full rounded-full bg-gradient-to-r from-volt to-volt/70 transition-[width] duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide">PENDING TEAMS</h3>
          <div className="space-y-3">
            {pendingRegistrations.length === 0 && <p className="text-sm text-ink-faint">Nothing to approve.</p>}
            {pendingRegistrations.map((p: any) => (
              <div key={p.id} className="rounded-xl border border-court-line p-3">
                <p className="text-sm font-medium">{p.team}</p>
                <p className="mt-0.5 text-xs text-ink-faint">{p.tournament}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-faint">{p.players} players</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => decide(p.id, "APPROVED")}
                      className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-volt/10 text-volt hover:bg-volt/20"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                    <button
                      onClick={() => decide(p.id, "REJECTED")}
                      className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-whistle/10 text-whistle hover:bg-whistle/20"
                    >
                      <XCircle size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
