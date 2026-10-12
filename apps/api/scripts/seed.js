import { configuration } from "../lib/config.js";
import { openDatabase } from "../lib/db.js";
import { seed } from "../lib/seed.js";
const config = configuration(),
  db = openDatabase(config.databasePath);
try {
  await seed(db, config);
  console.log("Seed complete. Existing accounts and records were preserved.");
} finally {
  db.close();
}
