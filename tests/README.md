# Tests

Task 57, Phase 7 — automated tests for the highest-risk parts of the app.

## Structure

- **`tests/unit/`** — pure business-logic functions with no database or
  network dependency: league standings math, recurring-booking date
  math, trainer open-slot computation, hashtag extraction, XP/level
  thresholds, and the Zod validation schemas. These run instantly and
  need nothing set up beyond `npm install`.

- **`tests/routes/`** — the three routes flagged as highest-risk in the
  roadmap (auth login, venue booking creation, tournament registration).
  `@/lib/prisma`, `@/lib/auth`, `@/lib/notify`, and `@/lib/gamification`
  are mocked with `vi.mock(...)`, so these tests exercise each route's
  own logic and branching — auth checks, validation, conflict/capacity
  checks, status codes — without needing a live database. The mocked
  Prisma calls are asserted against (e.g. "`booking.create` was never
  called") to catch logic bugs, not just status-code regressions.

## Running

```bash
npm test            # run once (used in CI — see .github/workflows/ci.yml)
npm run test:watch  # watch mode while developing
```

## Why mocked Prisma instead of a real test database

Mocking keeps the suite fast, deterministic, and runnable with zero
setup (no Postgres instance, no `DATABASE_URL`, no seed data) — good
for quick local iteration and for a CI job that shouldn't need
secrets. The trade-off is that these tests don't catch schema-level
issues (a typo'd Prisma field name, a broken migration, a real unique
constraint violation).

**If/when the team wants that extra coverage**, the natural next step
is a second `tests/integration/` suite that runs against a real
Postgres instance (e.g. a `postgres:16` service container in GitHub
Actions, with `prisma migrate deploy` run first) instead of mocks. The
route handlers themselves don't need to change for that — only the
`vi.mock("@/lib/prisma", ...)` calls would be removed in favor of the
real `lib/prisma.ts` client pointed at `DATABASE_URL_TEST`.

## Adding more tests

The existing route tests are a template: mock the modules the route
imports, import the route's exported `GET`/`POST`/`PATCH` function
directly, build a `NextRequest`, and assert on the response status/body
and on which mocked calls did or didn't happen. Good next candidates
(same "high-risk" bar as the existing three): booking cancellation
(`app/api/bookings/[id]/route.ts`), the admin approval flow, and the
2FA setup/verify routes.
