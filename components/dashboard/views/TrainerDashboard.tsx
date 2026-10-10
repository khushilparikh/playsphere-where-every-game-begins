"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, CalendarDays, MessageCircle, Star, PlusCircle, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { apiPatch } from "@/lib/api-client";
import type { AuthUser } from "@/components/providers/AuthProvider";

interface Props {
  user: AuthUser;
  data: { batches: any[]; students: any[]; inquiries: any[] };
  onChange?: () => void;
}

export function TrainerDashboard({ user, data, onChange }: Props) {
  const { batches, students, inquiries } = data;
  const avgAttendance = students.length
    ? Math.round(students.reduce((sum: number, s: any) => sum + s.attendance, 0) / students.length)
    : 0;
  const [replying, setReplying] = useState<string | null>(null);

  async function sendReply(id: string, reply: string) {
    try {
      await apiPatch(`/api/inquiries/${id}`, { reply });
      setReplying(null);
      onChange?.();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-court-line bg-gradient-to-br from-spark-soft via-court-surface to-volt-soft/60 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-spark">Trainer console</p>
          <h2 className="mt-1 font-display text-2xl tracking-wide">{user.name.toUpperCase()}</h2>
          <p className="mt-1 text-sm text-ink-muted">{user.area || "Ahmedabad"}</p>
        </div>
        <div className="flex gap-3">
          <LinkButton href="/trainers" size="sm">
            <PlusCircle size={15} /> Manage academy
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active students" value={students.length} icon={<Users size={16} />} />
        <StatCard label="Sessions this week" value={batches.length * 3} icon={<CalendarDays size={16} />} accent="blue" />
        <StatCard label="Avg. attendance" value={`${avgAttendance}%`} icon={<Star size={16} />} accent="whistle" />
        <StatCard label="New inquiries" value={inquiries.filter((i: any) => !i.reply).length} icon={<MessageCircle size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">MY BATCHES</h3>
            <Link href="/trainers" className="flex items-center gap-1 text-xs text-volt hover:underline">
              Manage all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="space-y-4">
            {batches.length === 0 && <p className="text-sm text-ink-faint">No batches yet — create one from the My Academy page.</p>}
            {batches.map((b: any) => (
              <div key={b.id} className="rounded-xl border border-court-line p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{b.name}</p>
                    <p className="mt-1 text-xs text-ink-faint">{b.days} · {b.time}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{b.venue}</p>
                  </div>
                  <Badge tone="volt">{b.students} students</Badge>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mb-3 mt-6 font-display text-base tracking-wide">STUDENTS</h3>
          <div className="space-y-2">
            {students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-ink-faint">{s.batch} · since {s.since}</p>
                </div>
                <span className={`font-mono text-xs ${s.attendance >= 90 ? "text-volt" : s.attendance >= 80 ? "text-ink-muted" : "text-whistle"}`}>
                  {s.attendance}% attendance
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide">INQUIRIES</h3>
          <div className="space-y-3">
            {inquiries.length === 0 && <p className="text-sm text-ink-faint">No inquiries yet.</p>}
            {inquiries.map((i: any) => (
              <div key={i.id} className="rounded-xl border border-court-line p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{i.from}</p>
                  <span className="text-[10px] text-ink-faint">{new Date(i.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{i.message}</p>
                {i.reply ? (
                  <p className="mt-2 rounded-lg bg-volt-soft px-2 py-1.5 text-xs text-volt">Replied: {i.reply}</p>
                ) : replying === i.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const val = (form.elements.namedItem("reply") as HTMLInputElement).value;
                      if (val) sendReply(i.id, val);
                    }}
                    className="mt-2 flex gap-1.5"
                  >
                    <input
                      name="reply"
                      autoFocus
                      placeholder="Type a reply…"
                      className="focus-ring flex-1 rounded-lg border border-court-line bg-court px-2 py-1.5 text-xs"
                    />
                    <button type="submit" className="rounded-lg bg-volt px-2.5 text-xs font-medium text-white">Send</button>
                  </form>
                ) : (
                  <button onClick={() => setReplying(i.id)} className="focus-ring mt-2 text-xs font-medium text-volt hover:underline">
                    Reply
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
