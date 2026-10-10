import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-court-line bg-court-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-volt text-court">
                <Zap size={16} strokeWidth={2.5} fill="currentColor" />
              </span>
              <span className="font-display text-lg tracking-wide">PLAYSPHERE</span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Where every game begins. Ahmedabad&apos;s sports community, venue booking,
              tournaments and live scoring — in one place.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Platform</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/venues" className="hover:text-volt">Venue booking</Link></li>
              <li><Link href="/tournaments" className="hover:text-volt">Tournaments</Link></li>
              <li><Link href="/live-scores" className="hover:text-volt">Live scoring</Link></li>
              <li><Link href="/players" className="hover:text-volt">Player finder</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Community</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/community" className="hover:text-volt">Feed</Link></li>
              <li><Link href="/trainers" className="hover:text-volt">Trainers &amp; academies</Link></li>
              <li><Link href="/teams" className="hover:text-volt">Teams</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Project</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li>B.E. Computer Engineering</li>
              <li>Indus University · 2023–27</li>
              <li>Academic Year Proposal</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-court-line pt-6 text-xs text-ink-faint sm:flex-row">
          <span>© 2026 PlaySphere. Built for Ahmedabad&apos;s sports community.</span>
          <span className="font-mono">Next.js · React · TypeScript · PostgreSQL · Prisma · Socket.IO</span>
        </div>
      </div>
    </footer>
  );
}
