# PlaySphere — Backend & Full-Stack Connection Guide

This document explains the backend that has been added to your PlaySphere
frontend, exactly how it connects to the UI you already have, and the
step-by-step process to get it running against **your own local PostgreSQL
installation**.

> **Important architectural note:** PlaySphere is not "a frontend project"
> and "a backend project" glued together — it is **one Next.js application**
> that contains both. This matches the technology stack in your original
> proposal (Chapter 8: *Next.js API Routes*). Your React components and your
> API endpoints live in the same codebase, run on the same `npm run dev`
> command, and deploy together. There is nothing separate to "connect" in
> the sense of pointing one server at another — the frontend simply calls
> `fetch("/api/...")` on its own origin. This guide still explains that
> connection in full detail below.

---

## 1. What was added

| Layer | Technology | Location |
|---|---|---|
| Database schema | Prisma ORM (PostgreSQL) | `prisma/schema.prisma` |
| Seed data | Prisma seed script | `prisma/seed.ts` |
| Auth | JWT (httpOnly cookie) + bcrypt | `lib/auth.ts`, `app/api/auth/*` |
| REST API | Next.js Route Handlers | `app/api/**/route.ts` (26 endpoints) |
| Real-time | Socket.IO on a custom server | `server.js`, `lib/socket-emit.ts` |
| Frontend data layer | `fetch` wrapper + hooks | `lib/api-client.ts`, `lib/use-api.ts`, `lib/socket-client.ts` |
| Auth state | React Context | `components/providers/AuthProvider.tsx` |

Nothing about your component library, design system, or page layouts
changed. Only **where the data comes from** changed — every page that used
to `import { ... } from "@/lib/mock-data"` for dynamic content now fetches
that same shape of data from an API route backed by PostgreSQL.

---

## 2. Prerequisites

- **Node.js 18+** (you already have this, since you're running the frontend)
- **PostgreSQL**, installed and running locally (you said you already have
  this) — you just need to know:
  - the port it's running on (default `5432`)
  - a username/password that can create databases
- A terminal in the `playsphere/` project folder

---

## 3. One-time setup

### 3.1 Install the new dependencies

The backend introduces new packages (`@prisma/client`, `prisma`,
`bcryptjs`, `jsonwebtoken`, `socket.io`, `socket.io-client`, and a couple of
dev-only helpers). They're already listed in `package.json` — just run:

```bash
npm install
```

### 3.2 Create the database

Open `psql` (or pgAdmin, or any Postgres client) and create an empty
database for the project:

```sql
CREATE DATABASE playsphere;
```

### 3.3 Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your real Postgres credentials:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/playsphere?schema=public"
JWT_SECRET="paste a long random string here"
```

Generate a good `JWT_SECRET` with:

```bash
openssl rand -base64 32
```

> `.env` is already listed in `.gitignore` — it will never be committed.

### 3.4 Create the database tables

This reads `prisma/schema.prisma` and creates every table (User, Venue,
Booking, Tournament, Team, TeamRegistration, LiveMatch, CommunityPost,
PlayerRequest, TrainerProfile, Academy, TrainerBatch, StudentEnrollment,
Inquiry, Notification, Report) in your `playsphere` database:

```bash
npx prisma migrate dev --name init
```

You'll see Prisma generate a `prisma/migrations/` folder and print a
success message. This also auto-generates the type-safe Prisma Client used
throughout `app/api/**`.

### 3.5 Seed realistic demo data

```bash
npx prisma db seed
```

This creates:

- **5 demo accounts** (password for all: `password123`)

  | Email | Role |
  |---|---|
  | `player@playsphere.demo` | Player |
  | `organizer@playsphere.demo` | Tournament Organizer |
  | `venue@playsphere.demo` | Venue Owner |
  | `trainer@playsphere.demo` | Trainer / Academy |
  | `admin@playsphere.demo` | Admin |

- A realistic set of venues, tournaments, teams, bookings, live matches,
  community posts, player requests, trainer batches/students/inquiries and
  notifications — the same content that used to live in
  `lib/mock-data.ts`, now real rows in your Postgres database.

You can re-run this any time to reset the demo data (it uses `upsert` for
the demo users, so it's safe to run repeatedly).

### 3.6 Run the app

```bash
npm run dev
```

This now runs `node server.js` instead of `next dev` directly (see
Section 6) — it starts Next.js **and** a Socket.IO server on the same port.
Open **http://localhost:3000**.

---

## 4. How the frontend actually calls the backend

### 4.1 The request path

```
Browser (React component)
   │  fetch("/api/venues", { credentials: "include" })
   ▼
Next.js Route Handler  (app/api/venues/route.ts)
   │  prisma.venue.findMany(...)
   ▼
Prisma Client
   │  SQL over TCP
   ▼
Your local PostgreSQL database
```

Every API route lives under `app/api/`. A file at
`app/api/venues/route.ts` is served at the URL `/api/venues`. Because
everything runs in the same Next.js app, there's no CORS configuration,
no separate base URL, and no environment-specific API host to manage in
development — `fetch("/api/venues")` always means "this same server."

### 4.2 The `lib/api-client.ts` wrapper

Every client component uses this instead of raw `fetch`:

```ts
import { apiGet, apiPost, apiPatch } from "@/lib/api-client";

const { venues } = await apiGet("/api/venues");
await apiPost("/api/bookings", { venueId, slot, sport, amount });
await apiPatch(`/api/bookings/${id}`, { status: "CONFIRMED" });
```

It always sends `credentials: "include"` (so the auth cookie goes with
every request) and throws a plain `Error` with the server's message on
failure, so every call site just needs `try { } catch (e) { alert(e.message) }`.

### 4.3 The `useApiGet` hook

Pages that just need to *display* data on load use this shared hook
(`lib/use-api.ts`):

```ts
const { data, loading, error, refresh } = useApiGet<{ venues: any[] }>("/api/venues");
```

It fetches on mount, exposes `loading`/`error` state, and gives you
`refresh()` to re-fetch after a mutation (e.g. after approving a booking).

### 4.4 Authentication flow, end to end

1. `POST /api/auth/register` or `POST /api/auth/login` — the server verifies
   credentials (or creates a new user with a bcrypt-hashed password),
   signs a JWT containing `{ userId, role }`, and sets it as an **httpOnly
   cookie** named `playsphere_token`. The browser stores this
   automatically — your React code never touches the token directly.
2. On every subsequent request, the browser automatically attaches that
   cookie (because `api-client.ts` sets `credentials: "include"`).
3. Every protected API route calls `getAuthUser(req)` (`lib/auth.ts`),
   which reads the cookie, verifies the JWT signature, and loads the full
   `User` row from Postgres via Prisma.
4. `AuthProvider` (`components/providers/AuthProvider.tsx`) calls
   `GET /api/auth/me` once when the app loads, to restore the session
   after a page refresh, and exposes `{ user, role }` to the whole app via
   `useAuth()`.
5. `RoleProvider` (the file your existing Sidebar/Topbar components import)
   is now a **thin compatibility shim** around `AuthProvider` — so none of
   your existing components had to change their imports. `useRole()` still
   returns `{ role, setRole }`, it's just backed by real sessions now.

### 4.5 The demo role switcher, now backed by real accounts

The "Continue as" buttons on the login page and the "Preview as" menu in
the top bar still work exactly as before in the UI — but instead of just
flipping a local variable, they now call `POST /api/auth/demo-login`,
which logs you into one of the 5 seeded accounts from Section 3.5. This
means switching roles now also switches *real, separate database records*
— the Organizer's "My Tournaments" really are a different set of rows than
the Player's bookings.

---

## 5. Full API reference

All routes are under `/api`. Routes marked 🔒 require a logged-in session
(the request must include the `playsphere_token` cookie).

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account (role-specific fields, see Section 6.4 of the frontend report) |
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/demo-login` | Log into a seeded demo account, `{ role: "player"\|"organizer"\|"venue"\|"trainer" }` |
| POST | `/api/auth/logout` | Clears the session cookie |
| GET | `/api/auth/me` | Current session's user, or `{ user: null }` |

### Venues & Bookings
| Method | Route | Description |
|---|---|---|
| GET | `/api/venues` | Public browse list. Query: `?sport=&area=&q=` |
| GET | `/api/venues?mine=true` | 🔒 Venues owned by the current user |
| POST | `/api/venues` | 🔒 Venue Owner creates a listing |
| GET/PATCH/DELETE | `/api/venues/:id` | Read / update / delete a venue (owner or admin) |
| GET | `/api/bookings` | 🔒 My bookings |
| GET | `/api/bookings?forOwner=true` | 🔒 Pending requests on venues I own |
| POST | `/api/bookings` | 🔒 Book a venue slot |
| PATCH | `/api/bookings/:id` | 🔒 Owner confirms/declines, `{ status }` |

### Tournaments & Teams
| Method | Route | Description |
|---|---|---|
| GET | `/api/tournaments` | Public browse. Query: `?sport=&status=` |
| GET | `/api/tournaments?mine=true` | 🔒 Tournaments I organize |
| POST | `/api/tournaments` | 🔒 Organizer creates a tournament |
| GET/PATCH | `/api/tournaments/:id` | Detail (+ registrations) / update |
| POST | `/api/tournaments/:id/register` | 🔒 Register my team, `{ teamId, players }` |
| PATCH | `/api/registrations/:id` | 🔒 Organizer approves/rejects, `{ status }` |
| GET | `/api/teams` | 🔒 My teams. `?all=true` for every team |
| POST | `/api/teams` | 🔒 Create a team (you become captain) |

### Community & Player Finder
| Method | Route | Description |
|---|---|---|
| GET | `/api/posts` | Feed. Query: `?sport=` |
| POST | `/api/posts` | 🔒 Create a post |
| GET | `/api/player-requests` | Open "need players" posts. Query: `?sport=` |
| POST | `/api/player-requests` | 🔒 Publish a request |

### Trainers, Academies & Live Scores
| Method | Route | Description |
|---|---|---|
| GET | `/api/trainers` | Public directory. Query: `?sport=` |
| POST | `/api/trainers` | 🔒 Trainer creates/updates their profile |
| GET | `/api/academies` | Public directory |
| POST | `/api/academies` | 🔒 Create an academy |
| GET | `/api/batches` | 🔒 My batches + students (Trainer) |
| POST | `/api/batches` | 🔒 Create a batch |
| GET | `/api/inquiries` | 🔒 Inquiries received (Trainer) |
| POST | `/api/inquiries` | 🔒 Send an inquiry to a trainer |
| PATCH | `/api/inquiries/:id` | 🔒 Trainer replies, `{ reply }` |
| GET | `/api/matches` | Live scoreboard. Query: `?status=LIVE\|UPCOMING\|FT` |
| POST | `/api/matches` | 🔒 Create a match (Organizer/Venue Owner/Admin) |
| PATCH | `/api/matches/:id` | 🔒 Update a score — **broadcasts over Socket.IO** |

### Notifications, Admin & Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/api/notifications` | 🔒 My notifications |
| PATCH | `/api/notifications/:id` | 🔒 Mark read, `{ read: true }` |
| GET | `/api/admin/approvals` | 🔒 Admin: venues awaiting verification |
| PATCH | `/api/admin/approvals/:id` | 🔒 Admin approves/rejects, `{ approve }` |
| GET | `/api/admin/reports` | 🔒 Admin: open community reports |
| POST | `/api/admin/reports` | 🔒 Report a post, `{ postId, reason }` |
| PATCH | `/api/admin/reports/:id` | 🔒 Admin dismisses/removes, `{ action }` |
| GET | `/api/dashboard` | 🔒 One aggregated payload shaped for whichever role is logged in |

---

## 6. Real-time live scores (Socket.IO)

Live scoring needs a persistent connection, which a purely serverless
Next.js deployment can't hold open. That's why `package.json`'s `dev` and
`start` scripts now run **`server.js`** instead of the bare `next`/`next
start` commands — it's a small custom Node server that does two things on
the same HTTP server/port:

1. Hands every normal request to Next.js as usual.
2. Attaches a Socket.IO server and stores it on `global.io`.

When `PATCH /api/matches/:id` updates a score, it calls
`emitEvent("match:update", match)` (`lib/socket-emit.ts`), which broadcasts
to every connected browser. The Live Scores page
(`app/(dashboard)/live-scores/page.tsx`) subscribes via the
`useLiveMatchSocket` hook (`lib/socket-client.ts`), so scores update
instantly without a page refresh — try opening the Live Scores page in two
browser tabs and updating a match's score via a `PATCH` request (e.g. with
curl or Postman) to see it happen live.

> If you ever run `next dev` or `next start` directly instead of
> `npm run dev`/`npm start`, Socket.IO won't be attached and
> `lib/socket-emit.ts` will just log a warning — the REST API still works
> fine, you just lose the live-push behaviour.

---

## 7. Verifying everything works

1. `npm run dev`, open http://localhost:3000
2. Click **Join free**, register a brand-new account as any role — this
   is a real `INSERT` into your Postgres `User` table.
3. Log out (top-right profile menu), then log back in with the same
   email/password — this is a real `SELECT` + bcrypt comparison.
4. On the login page, try the **Continue as** row for each of the four
   roles — each one logs into a different seeded account and shows a
   different sidebar/dashboard.
5. As the Venue Owner demo account, go to **My Venues** and approve/decline
   a booking request — refresh the page and confirm the change persisted
   (it's now a row update in Postgres, not client state).
6. Open **Prisma Studio** to see your data visually:
   ```bash
   npx prisma studio
   ```
   This opens a browser GUI at http://localhost:5555 where you can browse
   and edit every table directly.

---

## 8. Adding a new API endpoint (the established pattern)

Every route in this project follows the same shape. To add a new one:

1. **Add/extend a model** in `prisma/schema.prisma` if needed, then run
   `npx prisma migrate dev --name <description>`.
2. **Add a serializer** in `lib/serializers.ts` if the frontend needs a
   friendly JSON shape (e.g. converting `CRICKET` back to `"Cricket"`).
3. **Create `app/api/<resource>/route.ts`** with `GET`/`POST` exports:
   ```ts
   import { NextRequest, NextResponse } from "next/server";
   import { prisma } from "@/lib/prisma";
   import { getAuthUser } from "@/lib/auth";
   import { jsonError } from "@/lib/api-format";

   export async function GET(req: NextRequest) {
     const rows = await prisma.yourModel.findMany();
     return NextResponse.json({ items: rows });
   }

   export async function POST(req: NextRequest) {
     const user = await getAuthUser(req);
     if (!user) return jsonError("Not authenticated", 401);
     const body = await req.json();
     const row = await prisma.yourModel.create({ data: { ...body, userId: user.id } });
     return NextResponse.json({ item: row }, { status: 201 });
   }
   ```
4. **Call it from a component** with `useApiGet` (for reads) or
   `apiPost`/`apiPatch` (for writes), exactly as every existing page does.

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Can't reach database server` on migrate/seed/dev | Postgres isn't running, or `DATABASE_URL` in `.env` has the wrong port/password/db name |
| `relation "User" does not exist` | You skipped `npx prisma migrate dev` |
| Login/register works but role switching does nothing | Run `npx prisma db seed` — the demo accounts don't exist yet |
| Live scores don't update in real time | Make sure you started the app with `npm run dev` (which runs `server.js`), not `next dev` directly |
| `401 Not authenticated` on every request | The `playsphere_token` cookie isn't being sent — check that requests use `lib/api-client.ts` (which sets `credentials: "include"`), not raw `fetch` |
| Changing `prisma/schema.prisma` doesn't seem to take effect | Run `npx prisma migrate dev` again after every schema edit, and restart `npm run dev` |
| `EADDRINUSE` on start | Something else is using port 3000 — set `PORT=3001` in `.env` and restart |

---

## 10. What's still simplified (by design)

To keep this an honest, reviewable first backend pass rather than a
production system, a few things are intentionally minimal:

- **Passwords**: bcrypt-hashed, but there's no password-reset flow yet
  ("Forgot?" on the login page is still a placeholder link).
- **File uploads**: venue/post images are still plain URL strings — wiring
  Cloudinary (per your original proposal) is the natural next step.
- **Payments**: booking/tournament amounts are stored as plain integers;
  no Razorpay integration yet.
- **Marketing page ticker**: the public landing page's scrolling score
  ticker (shown to signed-out visitors) still reads from
  `lib/mock-data.ts` rather than `/api/matches`, since it's decorative
  content with no auth context — trivial to switch over if you want it
  live too.
- **Admin verification for trainers/academies**: only venues have a
  `status` (Active / Under review) approval flow right now; trainers and
  academies publish immediately. Adding the same `status` field to those
  models is a small, mechanical extension of the pattern already used for
  venues.

None of these block the app from working end-to-end — they're the
recommended order for your next iteration.
