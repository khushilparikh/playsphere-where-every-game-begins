import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Task 57, Phase 7: test runner config. Uses vite-tsconfig-paths so
// tests can import with the same "@/..." aliases as the app itself
// (see tsconfig.json's "paths"), rather than relative-path spaghetti.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node", // API route / lib tests only — no DOM needed
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    globals: false,
  },
});
