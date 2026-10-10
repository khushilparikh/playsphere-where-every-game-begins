"use client";

import { MapPin, Trophy, Award, Star, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useApiGet } from "@/lib/use-api";
import { useAuth } from "@/components/providers/AuthProvider";

const levelTone: Record<string, "volt" | "whistle" | "blue" | "muted"> = {
  Bronze: "muted",
  Silver: "blue",
  Gold: "whistle",
  Platinum: "volt",
  Diamond: "volt",
};

// Task 22, Phase 5: read-only public profile — a shareable view of a
// player's stats/badges (e.g. for a recruiter or organizer to check
// someone out), gated by GET /api/users/:id/public-profile on the
// existing User.profileVisibility setting.
export default function PublicPlayerProfilePage({ params }: { params: { id: string } }) {
  const { user: viewer } = useAuth();
  const router = useRouter();
  const { data, loading, error } = useApiGet<{ profile: any }>(`/api/users/${params.id}/public-profile`);
  const profile = data?.profile;
  const isSelf = viewer?.id === params.id;

  return (
    <div className="pb-16">
      <Topbar title="Player profile" />
      <div className="mx-auto max-w-2xl px-6 py-8">
        {loading && <p className="text-sm text-ink-faint">Loading…</p>}

        {error && (
          <Card className="p-6 text-center">
            <p className="text-sm font-medium text-whistle">This profile is private.</p>
            <p className="mt-1 text-xs text-ink-faint">Only the player themselves can view it.</p>
          </Card>
        )}

        {profile && (
          <>
            <Card className="overflow-hidden p-0">
              {profile.banner && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.banner} alt="" className="h-28 w-full object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-volt/15 text-xl font-bold text-volt">
                    {profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl tracking-wide">{profile.name.toUpperCase()}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={levelTone[profile.sportsPassportLevel] ?? "muted"}>{profile.sportsPassportLevel}</Badge>
                      <Badge tone="muted">{profile.role}</Badge>
                      {profile.area && (
                        <span className="flex items-center gap-1 text-xs text-ink-faint"><MapPin size={11} /> {profile.area}</span>
                      )}
                    </div>
                  </div>
                  {!isSelf && viewer && (
                    <Button size="sm" variant="outline" onClick={() => router.push(`/messages?to=${profile.id}`)}>
                      <MessageSquare size={13} /> Message
                    </Button>
                  )}
                </div>

                {profile.bio && <p className="mt-4 text-sm leading-relaxed text-ink-muted">{profile.bio}</p>}

                {profile.sportsPref?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {profile.sportsPref.map((s: string) => <Badge key={s} tone="muted">{s}</Badge>)}
                  </div>
                )}

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-court-line pt-4 text-center">
                  <div>
                    <p className="font-display text-lg text-volt">{profile.matchesPlayed}</p>
                    <p className="text-[11px] text-ink-faint">Matches</p>
                  </div>
                  <div>
                    <p className="font-display text-lg text-volt">{profile.tournamentsWon}</p>
                    <p className="text-[11px] text-ink-faint">Tournaments won</p>
                  </div>
                  <div>
                    <p className="font-display text-lg text-volt">{profile.xp}</p>
                    <p className="text-[11px] text-ink-faint">XP</p>
                  </div>
                </div>
              </div>
            </Card>

            {profile.badges?.length > 0 && (
              <Card className="mt-4 p-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
                  <Award size={13} /> Badges
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {profile.badges.map((b: any) => (
                    <div key={b.code} className="rounded-lg border border-court-line p-2.5 text-center">
                      <Trophy size={16} className="mx-auto text-volt" />
                      <p className="mt-1 text-[11px] font-medium">{b.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {(profile.experienceLevel || profile.dominantHand || profile.languages?.length > 0) && (
              <Card className="mt-4 p-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
                  <Star size={13} /> Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted sm:grid-cols-3">
                  {profile.experienceLevel && <div><p className="text-ink-faint">Experience</p><p className="mt-0.5 font-medium">{profile.experienceLevel}</p></div>}
                  {profile.dominantHand && <div><p className="text-ink-faint">Dominant hand</p><p className="mt-0.5 font-medium">{profile.dominantHand}</p></div>}
                  {profile.languages?.length > 0 && <div><p className="text-ink-faint">Languages</p><p className="mt-0.5 font-medium">{profile.languages.join(", ")}</p></div>}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
