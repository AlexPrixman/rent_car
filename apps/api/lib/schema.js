export const sqliteSchema = `PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('Manager','Employee')),
      active INTEGER NOT NULL DEFAULT 1, session_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL,
      license_number TEXT NOT NULL UNIQUE COLLATE NOCASE, active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY, plate TEXT NOT NULL UNIQUE COLLATE NOCASE, make TEXT NOT NULL, model TEXT NOT NULL,
      year INTEGER NOT NULL, category TEXT NOT NULL, daily_rate_cents INTEGER NOT NULL CHECK(daily_rate_cents>0),
      currency TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('available','maintenance','retired')),
      odometer INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
    INSERT OR IGNORE INTO counters VALUES ('rental',999);
    CREATE TABLE IF NOT EXISTS rentals (
      id TEXT PRIMARY KEY, number INTEGER NOT NULL UNIQUE, customer_id TEXT NOT NULL REFERENCES customers(id),
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id), customer_name TEXT NOT NULL, vehicle_label TEXT NOT NULL,
      plate TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, days INTEGER NOT NULL,
      daily_rate_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL, currency TEXT NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','stripe','paypal')),
      status TEXT NOT NULL CHECK(status IN ('reserved','active','completed','cancelled')),
      notes TEXT NOT NULL DEFAULT '', pickup_odometer INTEGER, return_odometer INTEGER,
      picked_up_at TEXT, returned_at TEXT, created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS rental_availability ON rentals(vehicle_id,status,start_date,end_date);
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, rental_id TEXT NOT NULL REFERENCES rentals(id), provider TEXT NOT NULL,
      mode TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('creating','pending','processing','paid','failed','cancelled')),
      amount_cents INTEGER NOT NULL, currency TEXT NOT NULL, external_id TEXT UNIQUE, checkout_url TEXT,
      public_token TEXT NOT NULL UNIQUE, reference TEXT, last_error TEXT,
      created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE UNIQUE INDEX IF NOT EXISTS one_current_payment ON payments(rental_id)
      WHERE status IN ('creating','pending','processing','paid');
    CREATE TABLE IF NOT EXISTS webhook_events (provider TEXT NOT NULL, event_id TEXT NOT NULL,
      processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(provider,event_id));
    CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY, actor_id TEXT REFERENCES users(id),
      action TEXT NOT NULL, entity_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
    PRAGMA user_version=1;`;
export const postgresSchema = `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('Manager','Employee')),
      active INTEGER NOT NULL DEFAULT 1, session_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL,
      license_number TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY, plate TEXT NOT NULL UNIQUE, make TEXT NOT NULL, model TEXT NOT NULL,
      year INTEGER NOT NULL, category TEXT NOT NULL, daily_rate_cents INTEGER NOT NULL CHECK(daily_rate_cents>0),
      currency TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('available','maintenance','retired')),
      odometer INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
    INSERT INTO counters VALUES ('rental',999) ON CONFLICT DO NOTHING;
    CREATE TABLE IF NOT EXISTS rentals (
      id TEXT PRIMARY KEY, number INTEGER NOT NULL UNIQUE, customer_id TEXT NOT NULL REFERENCES customers(id),
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id), customer_name TEXT NOT NULL, vehicle_label TEXT NOT NULL,
      plate TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, days INTEGER NOT NULL,
      daily_rate_cents INTEGER NOT NULL, total_cents BIGINT NOT NULL, currency TEXT NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','stripe','paypal')),
      status TEXT NOT NULL CHECK(status IN ('reserved','active','completed','cancelled')),
      notes TEXT NOT NULL DEFAULT '', pickup_odometer INTEGER, return_odometer INTEGER,
      picked_up_at TEXT, returned_at TEXT, created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS rental_availability ON rentals(vehicle_id,status,start_date,end_date);
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, rental_id TEXT NOT NULL REFERENCES rentals(id), provider TEXT NOT NULL,
      mode TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('creating','pending','processing','paid','failed','cancelled')),
      amount_cents BIGINT NOT NULL, currency TEXT NOT NULL, external_id TEXT UNIQUE, checkout_url TEXT,
      public_token TEXT NOT NULL UNIQUE, reference TEXT, last_error TEXT,
      created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE UNIQUE INDEX IF NOT EXISTS one_current_payment ON payments(rental_id)
      WHERE status IN ('creating','pending','processing','paid');
    CREATE TABLE IF NOT EXISTS webhook_events (provider TEXT NOT NULL, event_id TEXT NOT NULL,
      processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(provider,event_id));
    CREATE TABLE IF NOT EXISTS audit_log (id BIGSERIAL PRIMARY KEY, actor_id TEXT REFERENCES users(id),
      action TEXT NOT NULL, entity_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, data TEXT NOT NULL, expires BIGINT NOT NULL);
    
 CREATE UNIQUE INDEX IF NOT EXISTS username_case_unique ON users(lower(username));
 CREATE UNIQUE INDEX IF NOT EXISTS license_case_unique ON customers(lower(license_number));
 CREATE UNIQUE INDEX IF NOT EXISTS plate_case_unique ON vehicles(lower(plate));`;
