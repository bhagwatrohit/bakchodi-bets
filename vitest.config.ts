import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The postgres client connects lazily, so a dummy URL lets server modules
    // import cleanly in unit tests without a live database.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only` throws when imported outside a Server Component. Stub it
      // so server-side service modules can be unit-tested directly.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
});
