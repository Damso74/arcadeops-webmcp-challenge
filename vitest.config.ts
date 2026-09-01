import path from "node:path";
import { tmpdir } from "node:os";

import { defineConfig } from "vitest/config";

process.env.RELAY_SESSION_SECRET = "vitest-relay-session-secret-at-least-32-characters";
process.env.RELAY_COOKIE_SECURE = "0";
process.env.RELAY_DB_PATH = path.join(tmpdir(), `arcadeops-relay-vitest-${process.pid}.sqlite`);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "server-only": path.resolve(__dirname, "tests/server-only.ts"),
    },
  },
  test: {
    // The persistence and evaluation suites intentionally exercise one shared
    // SQLite file. Keep files sequential so separate Vitest workers never race
    // while enabling WAL on that fixture database.
    fileParallelism: false,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: { reporter: ["text", "json-summary"] },
  },
});
