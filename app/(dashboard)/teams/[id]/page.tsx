"use client";

import { Shield, Trophy } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useApiGet } from "@/lib/use-api";

// Task 23, Phase 5: read-only, shareable team profile — separate from
// the member-only Roster modal on /teams, which shows email addresses
// and management controls this page deliberately omits.
export default function PublicTeamProfilePage({ params }: { params: { id: string } }) {
  const { data, loading, error } = useApiGet<{ team: any }>(`/api/teams/${params.id}/public-profile`);
  const team = data?.team;
  const played = team ? team.wins + team.losses : 0;
  const winRate = played > 0 ? Math.round((team.wins / played) * 100) : 0;

  return (
    <div className="pb-16">
      <Topbar title="Team profile" />
      <div className="mx-auto max-w-2xl px-6 py-8">
        {loading && <p className="text-sm text-ink-faint">Loading…</p>}
        {error && (
          <Card className="p-6 text-center">
            <p className="text-sm font-medium text-whistle">Team not found.</p>
          </Card>
        )}

        {team && (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white"
                  style={{ backgroundColor: team.logoColor }}
                >
                  {team.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    team.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                  )}
                </span>
                <div>
                  <h2 className="font-display text-xl tracking-wide">{team.name.toUpperCase()}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone="muted">{team.sport}</Badge>
                    <span className="text-xs text-ink-faint">Captained by {team.captainName}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-court-line pt-4 text-center">
                <div>
                  <p className="font-display text-lg text-volt">{team.wins}</p>
                  <p className="text-[11px] text-ink-faint">Wins</p>
                </div>
                <div>
                  <p className="font-display text-lg text-whistle">{team.losses}</p>
                  <p className="text-[11px] text-ink-faint">Losses</p>
                </div>
                <div>
                  <p className="font-display text-lg">{winRate}%</p>
                  <p className="text-[11px] text-ink-faint">Win rate</p>
                </div>
              </div>
            </Card>

            <Card className="mt-4 p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
                <Shield size={13} /> Roster ({team.members.length})
              </h3>
              <div className="space-y-1.5">
                {team.members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-sm">
                    <span>{m.name}</span>
                    <Badge tone={m.roleName === "Captain" ? "volt" : "muted"}>{m.roleName}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
