import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import request from "supertest";
import { createApp } from "../app.js";
import { configuration } from "../lib/config.js";
import { seed } from "../lib/seed.js";

test(
  "PostgreSQL records and sessions survive application restart",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const schema = "rentdesk_test_" + randomUUID().replaceAll("-", "_");
    const admin = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.searchParams.set("options", `-c search_path=${schema}`);
    const config = configuration({ DATABASE_URL: url.href });
    let runtime;
    try {
      runtime = await createApp(config);
      await seed(runtime.db, config);
      const login = await request(runtime.app)
        .post("/api/auth/login")
        .send({ username: "manager", password: "RentDesk123!" })
        .expect(200);
      const cookie = login.headers["set-cookie"][0].split(";")[0];
      await runtime.close();
      runtime = undefined;
      runtime = await createApp(config);
      const records = await request(runtime.app)
        .get("/api/customers")
        .set("Cookie", cookie)
        .expect(200);
      assert.equal(records.body.total, 2);
      await request(runtime.app)
        .post("/api/auth/logout")
        .set("Cookie", cookie)
        .expect(204);
      await request(runtime.app)
        .get("/api/customers")
        .set("Cookie", cookie)
        .expect(401);
    } finally {
      if (runtime) await runtime.close();
      await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      await admin.end();
    }
  },
);
