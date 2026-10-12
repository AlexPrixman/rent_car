import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import pg from "pg";
import session from "express-session";
import { sqliteSchema, postgresSchema } from "./schema.js";

// All money and counts in this app are bounded below Number.MAX_SAFE_INTEGER.
pg.types.setTypeParser(20, (value) => Number(value));
pg.types.setTypeParser(1700, (value) => Number(value));

export function postgresSql(sql) {
  let parameter = 0,
    quoted = false,
    result = "";
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'") {
      if (quoted && sql[i + 1] === "'") {
        result += "''";
        i++;
        continue;
      }
      quoted = !quoted;
    }
    result += c === "?" && !quoted ? `$${++parameter}` : c;
  }
  return result;
}

export async function openDatabase(
  path,
  connectionString = "",
  temporarySchema = "",
) {
  const context = new AsyncLocalStorage();
  let pool, sqlite;
  let queue = Promise.resolve();
  async function serialize(job) {
    const previous = queue;
    let release;
    queue = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await job();
    } finally {
      release();
    }
  }
  if (connectionString) {
    if (temporarySchema && !/^rentdesk_test_[a-f0-9_]+$/.test(temporarySchema))
      throw new Error("Invalid temporary test schema");
    pool = new pg.Pool({
      connectionString,
      ...(temporarySchema
        ? { options: `-c search_path=${temporarySchema}` }
        : {}),
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      query_timeout: 15000,
    });
    pool.on("error", (error) =>
      console.error("Database connection failed:", error.code || error.name),
    );
    const client = await pool.connect();
    let initializationError;
    try {
      if (temporarySchema)
        await client.query(`CREATE SCHEMA "${temporarySchema}"`);
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(726381)");
      await client.query(postgresSchema);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      initializationError = error;
    } finally {
      client.release();
    }
    if (initializationError) {
      await pool.end();
      throw initializationError;
    }
  } else {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    sqlite = new DatabaseSync(path);
    sqlite.exec(sqliteSchema);
  }
  async function execute(sql, args, mode) {
    const current = context.getStore();
    if (pool) {
      const result = await (current?.client || pool).query(
        postgresSql(sql),
        args.map((v) => (typeof v === "boolean" ? Number(v) : v)),
      );
      return mode === "all"
        ? result.rows
        : mode === "get"
          ? result.rows[0]
          : { changes: result.rowCount };
    }
    const job = () =>
      sqlite
        .prepare(sql)
        [mode](...args.map((v) => (typeof v === "boolean" ? Number(v) : v)));
    return current ? job() : serialize(job);
  }
  return {
    dialect: pool ? "postgres" : "sqlite",
    prepare(sql) {
      return {
        get: (...args) => execute(sql, args, "get"),
        all: (...args) => execute(sql, args, "all"),
        run: (...args) => execute(sql, args, "run"),
      };
    },
    async transaction(job) {
      if (context.getStore()) return job();
      if (!pool)
        return serialize(async () => {
          sqlite.exec("BEGIN IMMEDIATE");
          try {
            const result = await context.run({ transaction: true }, job);
            sqlite.exec("COMMIT");
            return result;
          } catch (error) {
            sqlite.exec("ROLLBACK");
            throw error;
          }
        });
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // Serializes business mutations across connections and processes, preserving
        // SQLite's original availability and payment invariants on a small demo.
        await client.query("SELECT pg_advisory_xact_lock(726381)");
        const result = await context.run({ client }, job);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async close() {
      if (pool) {
        if (temporarySchema)
          await pool.query(`DROP SCHEMA "${temporarySchema}" CASCADE`);
        await pool.end();
      } else sqlite.close();
    },
  };
}

export const atomic = (db, callback) => db.transaction(callback);

export class DatabaseSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;
  }
  get(sid, callback) {
    this.db
      .prepare("SELECT data,expires FROM sessions WHERE sid=?")
      .get(sid)
      .then(async (row) => {
        if (!row || row.expires <= Date.now()) {
          if (row)
            await this.db.prepare("DELETE FROM sessions WHERE sid=?").run(sid);
          callback(null, null);
        } else callback(null, JSON.parse(row.data));
      })
      .catch(callback);
  }
  set(sid, value, callback = () => {}) {
    this.db
      .transaction(async () => {
        await this.db
          .prepare("DELETE FROM sessions WHERE expires<=?")
          .run(Date.now());
        await this.db
          .prepare(
            `INSERT INTO sessions(sid,data,expires) VALUES (?,?,?)
        ON CONFLICT(sid) DO UPDATE SET data=excluded.data,expires=excluded.expires`,
          )
          .run(
            sid,
            JSON.stringify(value),
            new Date(value.cookie.expires).getTime(),
          );
      })
      .then(() => callback())
      .catch(callback);
  }
  destroy(sid, callback = () => {}) {
    this.db
      .prepare("DELETE FROM sessions WHERE sid=?")
      .run(sid)
      .then(() => callback())
      .catch(callback);
  }
  touch(sid, value, callback) {
    this.set(sid, value, callback);
  }
}
