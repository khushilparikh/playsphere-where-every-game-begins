// Task 57, Phase 7: a placeholder DATABASE_URL so simply *importing*
// lib/prisma.ts (e.g. transitively, via lib/gamification.ts) doesn't
// throw in tests that never actually run a query — Prisma Client
// validates the env var is present at construction time, even before
// the first `.connect()`. Route/integration tests that need a real
// database set DATABASE_URL_TEST themselves (see tests/routes/README.md)
// and are skipped automatically when it's absent.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/playsphere_test_placeholder";
}
