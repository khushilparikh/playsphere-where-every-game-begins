"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { PlayerDashboard } from "@/components/dashboard/views/PlayerDashboard";
import { OrganizerDashboard } from "@/components/dashboard/views/OrganizerDashboard";
import { VenueDashboard } from "@/components/dashboard/views/VenueDashboard";
import { TrainerDashboard } from "@/components/dashboard/views/TrainerDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { role, user, loading: authLoading } = useAuth();
  const skip = authLoading || role === "admin";
  const { data, loading, error, refresh } = useApiGet<any>(skip ? null : "/api/dashboard", [role]);

  useEffect(() => {
    if (!authLoading && role === "admin") router.replace("/admin");
  }, [authLoading, role, router]);

  if (role === "admin") return null;

  return (
    <div className="pb-16">
      <Topbar title="Dashboard" />
      {(authLoading || loading) && (
        <p className="px-6 py-10 text-sm text-ink-faint">Loading your dashboard…</p>
      )}
      {error && (
        <p className="px-6 py-10 text-sm text-whistle">
          Couldn&apos;t load dashboard data: {error}. Is the backend running and the database seeded?
        </p>
      )}
      {!authLoading && !loading && !error && user && data && (
        <>
          {role === "player" && <PlayerDashboard user={user} data={data} onChange={refresh} />}
          {role === "organizer" && <OrganizerDashboard user={user} data={data} onChange={refresh} />}
          {role === "venue" && <VenueDashboard user={user} data={data} onChange={refresh} />}
          {role === "trainer" && <TrainerDashboard user={user} data={data} onChange={refresh} />}
        </>
      )}
    </div>
  );
}
