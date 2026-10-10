"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApiGet } from "@/lib/use-api";
import { apiPost } from "@/lib/api-client";
import { useAuth } from "@/components/providers/AuthProvider";

// Task 24, Phase 5: landing page for a team invite link/QR code
// (generated from the Roster modal — see app/(dashboard)/teams/page.tsx).
// Lives inside the (dashboard) route group like the rest of the app, so
// visiting it while signed out still redirects to /login via the
// existing middleware, then naturally lands back here after signing in.
export default function TeamInvitePage({ params }: { params: { token: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { data, error } = useApiGet<{ team: any }>(`/api/teams/join/${params.token}`);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const team = data?.team;

  const alreadyMember = team?.members?.some((m: any) => m.userId === user?.id);

  async function join() {
    setJoining(true);
    try {
      await apiPost(`/api/teams/join/${params.token}`, {});
      setJoined(true);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="pb-16">
      <Topbar title="Team invite" />
      <div className="mx-auto max-w-md px-6 py-16">
        <Card className="p-6 text-center">
          {error && (
            <>
              <p className="text-sm font-medium text-whistle">This invite link is invalid or has expired.</p>
              <p className="mt-1 text-xs text-ink-faint">Ask the team captain to send you a fresh one.</p>
            </>
          )}

          {!error && !team && <p className="text-sm text-ink-faint">Loading invite…</p>}

          {team && (
            <>
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-volt/15 text-volt">
                <Shield size={24} />
              </span>
              <h3 className="font-display text-lg tracking-wide">{team.name.toUpperCase()}</h3>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
                <Users size={12} /> {team.members?.length ?? 0} members · {team.sport}
              </p>

              {joined || alreadyMember ? (
                <>
                  <p className="mt-4 text-sm text-volt">You&apos;re on the team!</p>
                  <Button className="mt-4 w-full" onClick={() => router.push("/teams")}>Go to Teams</Button>
                </>
              ) : (
                <Button className="mt-5 w-full" onClick={join} disabled={joining}>
                  {joining ? "Joining…" : `Join ${team.name}`}
                </Button>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
