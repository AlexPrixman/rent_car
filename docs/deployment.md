# Deployment and persistence

The frontend and API can run on one Node.js 24 server. Build with `npm ci && npm run build`, set the environment below, run `npm run seed` once, then `npm start`. The Dockerfile provides the equivalent build/runtime split. Its production startup deliberately refuses insecure defaults.

| Environment variable    | Production value                                                                |
| ----------------------- | ------------------------------------------------------------------------------- |
| `NODE_ENV`              | `production`                                                                    |
| `PORT`                  | Internal service port, default `4000`                                           |
| `PUBLIC_APP_URL`        | Exact HTTPS frontend origin                                                     |
| `SESSION_SECRET`        | Unique, randomly generated string of 32+ characters                             |
| `DATABASE_PATH`         | Writable file on persistent local storage                                       |
| `BUSINESS_CURRENCY`     | `USD`, `EUR`, or `GBP`                                                          |
| `PAYMENTS_MODE`         | `sandbox` initially; `live` only after configuration/testing                    |
| `TRUST_PROXY`           | `true` only behind one trusted reverse proxy that sets HTTPS forwarding headers |
| `SEED_MANAGER_USERNAME` | Initial manager username                                                        |
| `SEED_MANAGER_PASSWORD` | Unique 12+ character initial password, required for production seeding          |

Generate a session secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and save it to your hosting environment. Add Stripe/PayPal credentials as described in [payments.md](payments.md). Unconfigured providers remain disabled; cash bookkeeping still works.

Production seeding creates only the requested manager, preserves existing accounts, and creates no demo data or employee. Production startup does not auto-seed. Remove the seed password from the runtime environment after setup. Use the manager interface to add staff. Changing the session secret signs out all staff.

Terminate HTTPS at a trusted reverse proxy and forward the original request protocol. Secure cookies require HTTPS. Serve the frontend and API on the same origin; no CORS configuration is needed. `/api/health` checks database connectivity. The included `compose.yml` is a local demo, not production configuration.

## Database and backups

SQLite uses foreign keys, WAL journaling, a busy timeout, and immediate write transactions. Keep the database and its WAL files on a persistent **local** volume, writable by the service account. Do not put the live database on a network filesystem or run multiple service instances against it.

Back up the database with SQLite’s online backup API, or stop the service and copy the database together with any `-wal` and `-shm` files. Test a restore before relying on the backup. Database files contain customer data and session records; restrict filesystem access. Schema version 1 is created automatically on first startup. Existing legacy PHP/MySQL data is not automatically imported.

For a container, mount `/app/data` persistently and set `DATABASE_PATH=/app/data/rentdesk.sqlite`. The image uses the non-root `node` account. Run the seed command with the same environment and volume as the app. Docker execution requires Docker on the deployment machine.

For horizontal scaling, migrate business records to a server database and sessions to a shared store, then replace the process-level payment operation lock with a distributed lock. The current app intentionally targets a single small-business API instance.

## Verification before live payments

Run the automated checks from the README and perform the real Stripe and PayPal sandbox checks with your merchant accounts. Verify restart persistence, HTTPS cookies, manager and employee access, webhook delivery, and backup restoration in the deployed environment. No provider credentials are required for automated tests, and those tests do not perform real charges.

## Render Free + Neon

Use a free Node web service from this repository, with `npm ci --include=dev && npm run build` as the build command and `npm start` as the start command. The package engines require Node 24. Deploy one instance. Set `DATABASE_URL` to the Neon connection string (pooled for application traffic), `NODE_ENV=production`, `PUBLIC_APP_URL` to the exact Render HTTPS URL, `SESSION_SECRET` to a unique random secret, and `TRUST_PROXY=true`. No disk is needed with PostgreSQL.

For a **public portfolio demonstration**, also set `PORTFOLIO_DEMO=true` and `PAYMENTS_MODE=demo`. Startup seeds the shared sample accounts only when there are no users. This mode rejects Stripe keys and PayPal secrets and labels the workspace and checkout as a demo. Never enter real customer details.

For a **business deployment**, leave `PORTFOLIO_DEMO=false`, use sandbox/live provider settings, and seed a private manager account with `npm run seed` using the same database URL. Never publish its credentials. Migrate existing SQLite records separately before switching a business database; configuring PostgreSQL creates an empty schema and does not import SQLite records.

The schema initializer uses the direct connection for test/validation workflows and a transaction-scoped advisory lock. With pooled application traffic all initialization statements run inside one transaction, without session-level state or named prepared statements. Only disposable CI schemas use a session-level search path, against the direct local CI database. Existing Neon Auth tables are untouched.

Verification includes `/api/health`, secure sign-in cookies, both role workflows, booking conflicts, simulated checkout, and persistence after redeployment.

On Render, `RENDER_EXTERNAL_URL` supplies the HTTPS application origin when `PUBLIC_APP_URL` is omitted. Override `PUBLIC_APP_URL` for a custom domain. The build includes dev dependencies explicitly because Vite and TypeScript are build tools, even though the runtime uses production mode.
