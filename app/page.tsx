import {
  Users,
  Trophy,
  MapPinned,
  Radio,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Check,
  X as XIcon,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Ticker } from "@/components/marketing/Ticker";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/fx/Reveal";
import { CountUp } from "@/components/fx/CountUp";
import { sports, stats } from "@/lib/mock-data";

const modules = [
  { icon: MessageSquare, title: "Sports Community", desc: "Post updates, find teammates, discuss matches and grow your local sports network." },
  { icon: Users, title: "Player Finder", desc: "Publish or join match requirements when your team is short of players." },
  { icon: Trophy, title: "Tournament Management", desc: "Create tournaments, manage registrations, auto-generate fixtures and publish results." },
  { icon: MapPinned, title: "Venue Booking", desc: "Search venues, compare prices, check live slot availability and book instantly." },
  { icon: Radio, title: "Live Scoring", desc: "Real-time score updates for cricket, football, badminton and more — built on Socket.IO." },
  { icon: GraduationCap, title: "Trainers & Academies", desc: "Discover certified trainers, browse academy batches and send inquiries directly." },
];

const stakeholders = [
  { title: "Players", desc: "Search, join matches, build a sports profile, connect with others." },
  { title: "Tournament Organizers", desc: "Create tournaments, manage registrations, fixtures and live updates." },
  { title: "Venue Owners", desc: "List venues, manage bookings, maximize utilization." },
  { title: "Trainers", desc: "Offer training programs, manage students, promote services." },
  { title: "Sports Academies", desc: "Promote academies, manage batches, attract new students." },
  { title: "Sponsors & Partners", desc: "Promote brands, support events, connect with the sports audience." },
];

const comparison = [
  { feature: "Venue Booking", playo: true, others: false, playsphere: true },
  { feature: "Player Finder", playo: true, others: false, playsphere: true },
  { feature: "Tournament Management", playo: false, others: true, playsphere: true },
  { feature: "Live Scoring", playo: false, others: false, playsphere: true },
  { feature: "Community Feed", playo: false, others: false, playsphere: true },
  { feature: "Trainer Marketplace", playo: false, others: false, playsphere: true },
  { feature: "Academy Directory", playo: false, others: false, playsphere: true },
  { feature: "Ahmedabad Focus", playo: false, others: false, playsphere: true },
];

const stack = [
  { layer: "Client side", items: "Next.js 14 · React · TypeScript · Tailwind CSS" },
  { layer: "Server side", items: "Node.js · Next.js API Routes · JWT Authentication" },
  { layer: "Data access", items: "Prisma ORM · Type-safe database operations" },
  { layer: "Database", items: "PostgreSQL — reliable, scalable, ACID compliant" },
  { layer: "Real-time", items: "Socket.IO for live scoring, chat and notifications" },
  { layer: "Services", items: "Cloudinary · Razorpay · Redis · Vercel · Supabase" },
];

function parseStat(value: string | number) {
  const str = String(value);
  const match = str.match(/^([\d,]+)(.*)$/);
  if (!match) return { end: 0, suffix: str };
  return { end: Number(match[1].replace(/,/g, "")), suffix: match[2] };
}

const heroStats = [
  ["Active users", stats.activeUsers],
  ["Venues listed", stats.venuesListed],
  ["Tournaments hosted", stats.tournamentsHosted],
  ["Matches scored", stats.matchesScored],
] as const;

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] animate-float rounded-full bg-volt/20 blur-[120px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[480px] w-[480px] animate-floatSlow rounded-full bg-whistle/18 blur-[120px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[18%] top-[30%] h-[220px] w-[220px] animate-float rounded-full bg-spark/12 blur-[90px]"
          style={{ animationDelay: "1.5s" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Reveal>
                <Badge tone="volt">
                  <Sparkles size={11} /> Built exclusively for Ahmedabad
                </Badge>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-wide text-balance sm:text-6xl lg:text-7xl">
                  WHERE EVERY
                  <br />
                  <span className="gradient-text animate-gradientMove">GAME</span> BEGINS
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-6 max-w-xl text-lg text-ink-muted">
                  One platform to find players, book venues, run tournaments and
                  follow live scores — replacing the WhatsApp groups, Google
                  Forms and phone calls that run Ahmedabad&apos;s sports today.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-9 flex flex-wrap gap-4">
                  <LinkButton href="/register" size="lg">
                    Start playing
                    <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </LinkButton>
                  <LinkButton href="/dashboard" variant="outline" size="lg">
                    View live dashboard
                  </LinkButton>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {heroStats.map(([label, value]) => {
                    const { end, suffix } = parseStat(value);
                    return (
                      <div key={label}>
                        <p className="font-display text-2xl tracking-wide text-ink sm:text-3xl">
                          <CountUp end={end} suffix={suffix} />
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-widest text-ink-faint">{label}</p>
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            </div>

            {/* Scoreboard signature panel */}
            <Reveal delay={200} className="relative">
              {/* Floating accent chips */}
              <div
                className="pointer-events-none absolute -left-6 -top-6 z-20 hidden animate-float rounded-xl border border-court-line bg-court-surface px-3 py-2 shadow-card-hover lg:block"
                style={{ animationDelay: "0.4s" }}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">Live now</p>
                <p className="text-xs font-semibold text-whistle">6 matches</p>
              </div>
              <div
                className="pointer-events-none absolute -bottom-6 -right-4 z-20 hidden animate-floatSlow rounded-xl border border-court-line bg-court-surface px-3 py-2 shadow-card-hover lg:block"
                style={{ animationDelay: "1.1s" }}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">Venues booked</p>
                <p className="text-xs font-semibold text-volt">today +48</p>
              </div>

              {/* Spinning 3D sport badge */}
              <div
                className="pointer-events-none absolute -right-7 top-1/3 z-20 hidden lg:block"
                style={{ perspective: "600px" }}
              >
                <div
                  className="relative h-16 w-16 animate-spinSlow"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {["🏏", "⚽", "🏸", "🏀"].map((emoji, i) => (
                    <div
                      key={emoji}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl border border-court-line bg-court-surface text-2xl shadow-card-hover"
                      style={{ transform: `rotateY(${i * 90}deg) translateZ(32px)` }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3D fanned card stack */}
              <div className="relative" style={{ perspective: "1400px" }}>
                <div
                  className="absolute inset-0 rounded-2xl border border-whistle/25 bg-whistle-soft/50 opacity-70 blur-[1px]"
                  style={{ transform: "translate(28px, 34px) rotateY(-8deg) rotateX(3deg) rotate(3deg)" }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0 rounded-2xl border border-spark/25 bg-spark-soft/60 opacity-80"
                  style={{ transform: "translate(14px, 18px) rotateY(-5deg) rotateX(2deg) rotate(1.5deg)" }}
                  aria-hidden
                />
                <div
                  className="relative"
                  style={{ transform: "rotateY(-3deg) rotateX(1.5deg)", transformStyle: "preserve-3d" }}
                >
                  <div className="gradient-ring rounded-2xl">
                    <Card glow tilt className="relative overflow-hidden p-0">
                      <div className="flex items-center justify-between border-b border-court-line px-5 py-3">
                        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-whistle">
                          <span className="h-2 w-2 animate-pulseDot rounded-full bg-whistle" />
                          Live on PlaySphere
                        </span>
                        <span className="font-mono text-xs text-ink-faint">Ahmedabad</span>
                      </div>
                      <div className="divide-y divide-court-line">
                        <div className="p-5 transition-colors hover:bg-volt-soft/40">
                          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                            Cricket · Karnavati Ground
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-display text-lg tracking-wide">SATELLITE STRIKERS</span>
                            <span className="font-mono text-2xl text-volt">142/4</span>
                          </div>
                          <p className="mt-1 text-xs text-ink-muted">Overs 14.2 · req. 6.2 RR</p>
                        </div>
                        <div className="p-5 transition-colors hover:bg-volt-soft/40">
                          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                            Football · Sabarmati Turf
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-display text-lg tracking-wide">SG UNITED</span>
                            <span className="font-mono text-2xl text-volt">2 – 1</span>
                          </div>
                          <p className="mt-1 text-xs text-ink-muted">72&apos; · Vastrapur FC</p>
                        </div>
                        <div className="p-5 transition-colors hover:bg-volt-soft/40">
                          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                            Badminton · Prahladnagar Courts
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-ink-muted">Next match starts in</span>
                            <span className="font-mono text-lg text-whistle">42:11</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <Ticker />
      </section>

      {/* Ecosystem */}
      <section id="modules" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <SectionHeading
            eyebrow="The ecosystem"
            title="Every sports stakeholder, one connected platform"
            description="PlaySphere links the six groups that keep Ahmedabad's sports scene running — so nobody has to coordinate across five different apps."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stakeholders.map((s, i) => (
            <Reveal key={s.title} delay={i * 70}>
              <Card hover glow className="h-full p-6">
                <h3 className="font-display text-lg tracking-wide">{s.title.toUpperCase()}</h3>
                <p className="mt-2 text-sm text-ink-muted">{s.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="border-y border-court-line bg-gradient-to-b from-volt-soft/60 via-court-surface/80 to-court-surface/80 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Core modules"
              title="Everything the proposal promised, built"
              description="Ten functional modules covering community, competition and commerce for local sport."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <Reveal key={m.title} delay={i * 70}>
                <Card hover glow className="group h-full p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-volt/10 text-volt transition-transform duration-300 group-hover:scale-110">
                    <m.icon size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-lg tracking-wide">{m.title.toUpperCase()}</h3>
                  <p className="mt-2 text-sm text-ink-muted">{m.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sports supported */}
      <section id="sports" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <SectionHeading eyebrow="Multi-sport" title="Built for how Ahmedabad actually plays" />
        </Reveal>
        <div className="mt-10 flex flex-wrap gap-3">
          {sports.map((s, i) => (
            <Reveal key={s} delay={i * 50} className="inline-block">
              <span className="inline-block cursor-default rounded-full border border-court-line bg-court-surface px-5 py-2.5 font-display text-sm tracking-wide text-ink-muted shadow-card transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-volt/50 hover:text-volt hover:shadow-card-hover">
                {s.toUpperCase()}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-court-line bg-gradient-to-b from-court-surface/80 via-spark-soft/50 to-court-surface/80 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <SectionHeading eyebrow="How it works" title="From sign-up to scoreboard in four steps" />
          </Reveal>
          <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-[9px] hidden h-px bg-gradient-to-r from-transparent via-court-line to-transparent lg:block" aria-hidden />
            {[
              ["01", "Create your sports profile", "Register, pick your sports and set your home area in Ahmedabad."],
              ["02", "Find your game", "Book a venue, join a tournament, or post a player request for this weekend."],
              ["03", "Play & track live", "Follow real-time scores, fixtures and standings as the match happens."],
              ["04", "Grow your network", "Share results to the community feed and connect with trainers and academies."],
            ].map(([num, title, desc], i) => (
              <Reveal key={num} delay={i * 100} className="relative border-l-2 border-volt/40 pl-5">
                <span className="font-mono text-xs text-volt">{num}</span>
                <h3 className="mt-3 font-display text-base tracking-wide">{title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Why PlaySphere"
            title="What existing apps leave scattered, we bring together"
            description="Playo, Hudle, CricHeroes, TeamSnap and SportEasy each solve one piece. PlaySphere is the only one built around all of them, for Ahmedabad specifically."
          />
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-court-line shadow-card">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-court-line bg-court-surface2 text-left">
                  <th className="px-5 py-4 font-medium text-ink-faint">Feature</th>
                  <th className="px-5 py-4 font-medium text-ink-faint">Playo</th>
                  <th className="px-5 py-4 font-medium text-ink-faint">Others</th>
                  <th className="px-5 py-4 font-display tracking-wide text-volt">PlaySphere</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`transition-colors hover:bg-volt-soft/50 ${i % 2 === 0 ? "bg-court-surface" : "bg-court-surface2/60"}`}
                  >
                    <td className="px-5 py-4 text-ink">{row.feature}</td>
                    <td className="px-5 py-4">
                      {row.playo ? <Check size={16} className="text-ink-muted" /> : <XIcon size={16} className="text-ink-faint" />}
                    </td>
                    <td className="px-5 py-4">
                      {row.others ? <Check size={16} className="text-ink-muted" /> : <XIcon size={16} className="text-ink-faint" />}
                    </td>
                    <td className="px-5 py-4">
                      {row.playsphere ? <Check size={16} className="text-volt" /> : <XIcon size={16} className="text-ink-faint" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* Tech stack */}
      <section id="stack" className="border-y border-court-line bg-gradient-to-b from-whistle-soft/50 via-court-surface/80 to-court-surface/80 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <SectionHeading eyebrow="Under the hood" title="A modern, scalable technology stack" />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stack.map((s, i) => (
              <Reveal key={s.layer} delay={i * 60}>
                <Card hover className="h-full p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-volt">{s.layer}</p>
                  <p className="mt-2 font-mono text-sm text-ink-muted">{s.items}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <Card
            glow
            className="relative flex flex-col items-center gap-6 overflow-hidden border-volt/30 bg-gradient-to-br from-court-surface to-court-surface2 p-12 text-center shadow-glow"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 animate-float rounded-full bg-volt/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-52 w-52 animate-floatSlow rounded-full bg-whistle/10 blur-3xl" aria-hidden />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-volt/10 text-volt">
              <ShieldCheck size={28} />
            </span>
            <h2 className="relative max-w-2xl font-display text-3xl tracking-wide sm:text-4xl">
              READY TO DIGITIZE YOUR NEXT MATCH?
            </h2>
            <p className="relative max-w-xl text-ink-muted">
              Join thousands of players, organizers and venue owners already using
              PlaySphere across Ahmedabad.
            </p>
            <div className="relative flex flex-wrap justify-center gap-4">
              <LinkButton href="/register" size="lg">
                Create free account
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </LinkButton>
              <LinkButton href="/venues" variant="outline" size="lg">
                Browse venues
              </LinkButton>
            </div>
          </Card>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
