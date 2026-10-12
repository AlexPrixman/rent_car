import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configuration } from "../lib/config.js";
import { createApp } from "../app.js";
import { seed } from "../lib/seed.js";
const directory = mkdtempSync(join(tmpdir(), "rentdesk-e2e-"));
const config = configuration({
  DATABASE_PATH: join(directory, "e2e.sqlite"),
  DATABASE_URL: process.env.E2E_DATABASE_URL || "",
  PUBLIC_APP_URL: "http://127.0.0.1:4001",
  PORT: "4001",
  PAYMENTS_MODE: "demo",
  SESSION_SECRET: "isolated-e2e-session-secret-only",
});
const runtime = await createApp(config, {
  loginLimit: 1000,
  ...(process.env.E2E_DATABASE_URL
    ? { databaseSchema: "rentdesk_test_" + randomUUID().replaceAll("-", "_") }
    : {}),
});
await seed(runtime.db, config);
const server = runtime.app.listen(config.port, "127.0.0.1", () =>
  console.log("Isolated browser test server ready"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () =>
    server.close(async () => {
      await runtime.close();
      rmSync(directory, {
        recursive: true,
        force: true,
      });
      process.exit(0);
    }),
  );
