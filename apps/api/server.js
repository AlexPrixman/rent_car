import { configuration } from "./lib/config.js";
import { createApp } from "./app.js";
import { seed } from "./lib/seed.js";
const config = configuration(),
  runtime = await createApp(config);
if (!config.production || config.portfolioDemo) await seed(runtime.db, config);
const server = runtime.app.listen(config.port, () =>
  console.log(
    `RentDesk API running on port ${config.port} (${config.mode} payments)`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () =>
    server.close(async () => {
      await runtime.close();
      process.exit(0);
    }),
  );
