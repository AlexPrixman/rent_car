# API contract

All routes use JSON. Errors return `{ "error": "Human-readable message" }`. Staff authentication uses a persistent, HttpOnly session cookie; the frontend and API share an origin. Money in responses is integer cents. Dates are `YYYY-MM-DD`, with rental return dates exclusive.

| Route                                   | Access               | Purpose                                                      |
| --------------------------------------- | -------------------- | ------------------------------------------------------------ |
| `GET /api/health`                       | Public               | Database/service health                                      |
| `GET /api/config`                       | Public               | Currency, payment mode, provider availability                |
| `POST /api/auth/login`                  | Public, rate limited | `{username,password}`                                        |
| `POST /api/auth/logout`                 | Session              | End session                                                  |
| `GET /api/auth/me`                      | Staff                | Current active staff identity                                |
| `GET /api/dashboard`                    | Staff                | Counts, recent rentals, paid totals grouped by currency/mode |
| `GET/POST /api/customers`               | Staff                | List/create customers                                        |
| `PATCH /api/customers/:id`              | Staff                | Edit/archive/restore customer                                |
| `GET/POST /api/vehicles`                | Staff                | List/create vehicles                                         |
| `PATCH /api/vehicles/:id`               | Staff                | Edit rate, mileage, details, service status                  |
| `GET/POST /api/employees`               | Manager              | List/create staff                                            |
| `PATCH /api/employees/:id`              | Manager              | Edit name, password, role, active status                     |
| `GET/POST /api/rentals`                 | Staff                | List/create reservations                                     |
| `POST /api/rentals/quote`               | Staff                | Validate dates/availability and calculate price              |
| `GET/PATCH /api/rentals/:id`            | Staff                | Read/edit rental (terms locked after payment/link)           |
| `POST /api/rentals/:id/pickup`          | Staff                | `{odometer}`; requires reserved, paid, dates valid           |
| `POST /api/rentals/:id/return`          | Staff                | `{odometer}`; requires active                                |
| `POST /api/rentals/:id/cancel`          | Staff                | Cancel reservation and unpaid link; preserve paid history    |
| `POST /api/rentals/:id/payments/cash`   | Staff                | `{received:true,reference?}`; full cash payment              |
| `POST /api/rentals/:id/payments/link`   | Staff                | Create/reuse Stripe/PayPal checkout URL                      |
| `POST /api/rentals/:id/payments/cancel` | Staff                | Cancel/expire unpaid checkout                                |
| `POST /api/rentals/:id/payments/verify` | Staff                | Reconcile saved provider payment                             |
| `GET /api/checkout/:token`              | Token holder         | Payment summary without customer contact/license data        |
| `POST /api/checkout/:token/reconcile`   | Token holder         | Verify saved provider session/order                          |
| `POST /api/checkout/:token/capture`     | Token holder         | Capture approved PayPal order safely                         |
| `POST /api/checkout/:token/demo`        | Demo mode only       | Explicit simulated payment                                   |
| `POST /api/payments/webhooks/stripe`    | Stripe signature     | Raw-body signed webhook                                      |
| `POST /api/payments/webhooks/paypal`    | PayPal signature     | Provider-verified webhook                                    |

List routes return `{items,total,page,pageSize}`. They accept `q`, `page` (default 1), and `pageSize` (1–100, default 20). Customers/employees support `active=true`; vehicles support `status=available|maintenance|retired`; rentals support `status=reserved|active|completed|cancelled`. Search input is escaped for SQL LIKE and all data values use prepared statements.

Customer input: `{name,email?,phone,licenseNumber}`; updates require the full record plus boolean `active`. Vehicle input: `{plate,make,model,year,category,dailyRate,status,odometer}`, with `dailyRate` as a decimal string and the business currency from configuration. Employee creation: `{username,name,role,password}`; updates: `{name,role,active,password?}`. Rental input: `{customerId,vehicleId,startDate,endDate,paymentMethod,notes?}`. Notes-only updates remain possible after terms are locked.

Status codes include 400 validation/signature/mismatched payment, 401 expired/missing login, 403 role/origin checks, 404 missing records, 409 conflicts/invalid transitions, 429 rate limiting, 502 provider failures, and 503 missing provider configuration. Provider failures preserve uncertain creation/capture records for idempotent retry rather than accepting a second payment.
