# PlaySphere — Full Stack

A complete sports community, venue booking, tournament management and live
scoring platform for Ahmedabad — built with the stack named in the original
proposal's Chapter 8: **Next.js 14, React, TypeScript, Tailwind CSS,
PostgreSQL, Prisma ORM, Socket.IO**.

This is now a real full-stack application: the frontend you saw first is
unchanged in look and feel, but every page reads and writes real data
through a Postgres database via a JWT-authenticated REST API — all inside
this same Next.js project.

**→ See [`BACKEND_GUIDE.md`](./BACKEND_GUIDE.md) for the complete setup
walkthrough, API reference, and how the frontend/backend connect.**

## Quick start (real data — recommended)

```bash
npm install
cp .env.example .env        # then fill in your local Postgres URL + a JWT secret
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000 and click **Register**. Pick your role — Player,
Tournament Organizer, Venue Owner, Trainer/Academy, or **Admin** — and fill
in your own real details, written straight to Postgres. No sample data is
inserted. This is the setup you want for the actual submission/demo.

**Creating an Admin account:** select "Admin" on the Register page and
enter the access code from `ADMIN_SIGNUP_CODE` in your `.env` file (see
`.env.example`). This keeps admin accounts from being created by accident
— a normal Player/Organizer/Venue Owner/Trainer signup can never become
an admin.

## Optional: load demo data

If you just want to click around with pre-filled sample accounts (for a
quick screenshot, not for your real demo), you can additionally run:

```bash
npm run db:seed:demo
```

This fills the same database with sample users/venues/tournaments (see
`prisma/seed.ts`, all logins use password `password123`). **Do not run
this before submitting/grading the project** — it will make every screen
show fabricated data instead of what your team entered. It also no longer
runs automatically: earlier versions of this project were configured so
that `npx prisma migrate dev` silently re-ran the seed script every single
time, which is why the app kept showing pre-written data no matter what
you entered — that hook has been removed.

## Recent fixes in this build

- Tournament **Fixtures** and **View details** buttons now do something
  (bracket view / read-only detail modal) instead of nothing.
- Tournament registration uses the team's real roster size instead of a
  hardcoded 11 players.
- Fixed a race condition where rapidly double-clicking "approve" on a team
  registration could credit a tournament's revenue twice for one team.
- Team **Roster** and **Team chat** buttons are wired up (new
  `ChatMessage`/member-invite endpoints).
- **Request to join** on the Player Finder page now actually sends a
  request and shows a "Requested" state.
- Every API route now catches unexpected errors and returns a real JSON
  message instead of crashing into a generic "Request failed" alert.
- Trainer inquiries and venue booking use a proper in-app modal instead of
  the browser's `prompt()` dialog.
- Venues now capture a full **address**, phone, and description, and show
  an embedded **Google Map** (no API key needed — uses the public
  `google.com/maps?...&output=embed` URL) on both the browse and manage
  views.
- Booking-request cards for venue owners now show the sport, a readable
  slot, and the requester's phone/email.

## What's included

- **Marketing site** (`/`) — hero, ecosystem overview, module grid,
  comparison table vs. Playo/Hudle/CricHeroes etc., tech stack section
- **Real authentication** — `/login`, `/register`, JWT sessions in an
  httpOnly cookie, bcrypt-hashed passwords, role-specific onboarding fields
- **Role-based application shell** (route group `app/(dashboard)`) — the
  sidebar, dashboard, and three shared pages (Venues, Tournaments,
  Trainers) all render differently depending on whether you're a Player,
  Tournament Organizer, Venue Owner, or Trainer/Academy
- **A real Postgres-backed REST API** — 26 endpoints across auth, venues,
  bookings, tournaments, team registrations, teams, community posts,
  player requests, trainers, academies, batches, inquiries, live matches,
  notifications and admin moderation
- **Real-time live scores** over Socket.IO — score updates broadcast
  instantly to every connected browser (see `server.js`)

## Design system

Bright "match day" identity inspired by broadcast scoring apps: a soft
white/cool-gray canvas, electric stadium-blue (`volt`) as the primary
action color, scoreboard-tangerine (`whistle`) as the live/secondary
accent, a violet (`spark`) tertiary accent, deep navy-ink text, a condensed
athletic display face (Anton) for headlines, Inter for body text, and
JetBrains Mono for scores/stats — see `tailwind.config.ts` for the full
token set.

## Project structure

```
app/                 Pages (App Router) + all API routes under app/api/**
components/          UI library, marketing, dashboard shell, role views, fx, providers
lib/                 Prisma client, auth helpers, serializers, API client, mock constants
prisma/              schema.prisma + seed.ts
server.js            Custom Node server (Next.js + Socket.IO)
BACKEND_GUIDE.md      Full setup, API reference, troubleshooting
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the app (Next.js + Socket.IO) at localhost:3000 |
| `npm run build` / `npm start` | Production build & start |
| `npm run prisma:migrate` | Apply schema changes to your database |
| `npm run db:seed:demo` | Optional — load sample demo data (do not use before grading) |
| `npm run prisma:studio` | Visual database browser at localhost:5555 |
| `npm test` | Run the automated test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode while developing |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run lint` | Run ESLint |
| `npm run season:snapshot` | Close out a leaderboard season (see `scripts/snapshot-season.ts`) |

See `tests/README.md` for the testing strategy. CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests, and a production build against a real Postgres service container on every push/PR to `main`.
