"use client";

import Link from "next/link";
import { Building2, CalendarCheck, TrendingUp, Star, PlusCircle, Check, X, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { apiPatch } from "@/lib/api-client";
import type { AuthUser } from "@/components/providers/AuthProvider";

interface Props {
  user: AuthUser;
  data: { venues: any[]; bookingRequests: any[] };
  onChange?: () => void;
}

export function VenueDashboard({ user, data, onChange }: Props) {
  const { venues, bookingRequests } = data;
  const activeVenues = venues.filter((v) => v.status === "Active");
  const bookingsToday = venues.reduce((sum, v) => sum + v.bookingsToday, 0);
  const revenue = venues.reduce((sum, v) => sum + v.revenueThisMonth, 0);
  const avgOccupancy = Math.round(
    activeVenues.reduce((sum, v) => sum + v.occupancy, 0) / (activeVenues.length || 1)
  );

  async function decide(id: string, status: "CONFIRMED" | "DECLINED") {
    try {
      await apiPatch(`/api/bookings/${id}`, { status });
      onChange?.();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-court-line bg-gradient-to-br from-volt-soft via-court-surface to-spark-soft/60 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-volt">Venue owner console</p>
          <h2 className="mt-1 font-display text-2xl tracking-wide">{user.name.toUpperCase()}</h2>
          <p className="mt-1 text-sm text-ink-muted">{venues.length} venues · {user.area || "Ahmedabad"}</p>
        </div>
        <div className="flex gap-3">
          <LinkButton href="/venues" size="sm">
            <PlusCircle size={15} /> Manage venues
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active venues" value={activeVenues.length} icon={<Building2 size={16} />} />
        <StatCard label="Bookings today" value={bookingsToday} icon={<CalendarCheck size={16} />} accent="blue" />
        <StatCard label="Avg. occupancy" value={`${avgOccupancy}%`} icon={<TrendingUp size={16} />} accent="whistle" />
        <StatCard label="Revenue this month" value={`₹${revenue.toLocaleString("en-IN")}`} icon={<Star size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">MY VENUES</h3>
            <Link href="/venues" className="flex items-center gap-1 text-xs text-volt hover:underline">
              Manage all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="space-y-4">
            {venues.length === 0 && <p className="text-sm text-ink-faint">You haven&apos;t listed a venue yet.</p>}
            {venues.map((v) => (
              <div key={v.id} className="rounded-xl border border-court-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{v.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {v.sports.map((s: string) => <Badge key={s} tone="muted">{s}</Badge>)}
                      <Badge tone={v.status === "Active" ? "volt" : "whistle"}>{v.status}</Badge>
                    </div>
                  </div>
                  {v.rating > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-volt">
                      <Star size={12} fill="currentColor" /> {v.rating}
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-court px-2 py-2">
                    <p className="font-display text-base text-volt">{v.bookingsToday}</p>
                    <p className="text-[9px] uppercase tracking-widest text-ink-faint">Today</p>
                  </div>
                  <div className="rounded-lg bg-court px-2 py-2">
                    <p className="font-display text-base text-whistle">{v.occupancy}%</p>
                    <p className="text-[9px] uppercase tracking-widest text-ink-faint">Occupancy</p>
                  </div>
                  <div className="rounded-lg bg-court px-2 py-2">
                    <p className="font-display text-base text-ink">₹{(v.revenueThisMonth / 1000).toFixed(0)}k</p>
                    <p className="text-[9px] uppercase tracking-widest text-ink-faint">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide">BOOKING REQUESTS</h3>
          <div className="space-y-3">
            {bookingRequests.length === 0 && <p className="text-sm text-ink-faint">No pending requests.</p>}
            {bookingRequests.map((b: any) => (
              <div key={b.id} className="rounded-xl border border-court-line p-3">
                <p className="text-sm font-medium">{b.requestedBy}</p>
                <p className="mt-0.5 text-xs text-ink-faint">{b.venue}</p>
                <p className="text-xs text-ink-faint">{b.slot}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-volt">₹{b.amount}</span>
                    {b.paymentStatus === "SUCCESS" && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">Paid</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => decide(b.id, "CONFIRMED")}
                      className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-volt/10 text-volt hover:bg-volt/20"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => decide(b.id, "DECLINED")}
                      className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-whistle/10 text-whistle hover:bg-whistle/20"
                    >
                      <X size={13} />
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
