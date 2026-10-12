import test from "node:test";
import assert from "node:assert/strict";
import { cents, duration, password } from "../lib/validation.js";
import { configuration } from "../lib/config.js";
test("decimal money is exact in cents", () => {
  assert.equal(cents("55.10"), 5510);
  assert.equal(cents("0.01"), 1);
  assert.equal(cents("45"), 4500);
});
test("money rejects negative, ambiguous precision, and excessive amounts", () => {
  for (const value of [
    "0",
    "-1",
    "1.999",
    "NaN",
    "1e4",
    Infinity,
    0.1 + 0.2,
    "1000000.01",
  ])
    assert.throws(() => cents(value), { status: 400 });
});
test("rental dates are exclusive, valid, and limited to one year", () => {
  assert.equal(duration("2028-02-28", "2028-03-01"), 2);
  for (const dates of [
    ["2026-02-29", "2026-03-01"],
    ["2026-02-30", "2026-03-02"],
    ["2026-01-01", "2026-01-01"],
    ["2026-01-02", "2026-01-01"],
    ["2026-01-01", "2028-01-01"],
  ])
    assert.throws(() => duration(...dates), { status: 400 });
});
test("password length limits apply to UTF-8 bytes", () => {
  assert.equal(password("RentDesk123!"), "RentDesk123!");
  assert.throws(() => password("short"));
  assert.throws(() => password("🔒".repeat(19)));
});
test("production rejects demo payments, insecure origins, and development secrets", () => {
  const env = {
    NODE_ENV: "production",
    PUBLIC_APP_URL: "https://rent.example.com",
    SESSION_SECRET: "x".repeat(40),
    PAYMENTS_MODE: "sandbox",
  };
  assert.equal(configuration(env).production, true);
  for (const patch of [
    { PAYMENTS_MODE: "demo" },
    { PUBLIC_APP_URL: "http://rent.example.com" },
    { SESSION_SECRET: "short" },
    { STRIPE_SECRET_KEY: "sk_live_wrong" },
  ])
    assert.throws(() => configuration({ ...env, ...patch }));
});

test("public portfolio demo is explicit and rejects merchant secrets", () => {
  const env = {
    NODE_ENV: "production",
    PUBLIC_APP_URL: "https://demo.example.com",
    SESSION_SECRET: "x".repeat(40),
    PAYMENTS_MODE: "demo",
    PORTFOLIO_DEMO: "true",
  };
  assert.equal(configuration(env).portfolioDemo, true);
  assert.throws(() =>
    configuration({ ...env, PAYPAL_CLIENT_SECRET: "secret" }),
  );
  assert.throws(() =>
    configuration({ ...env, STRIPE_SECRET_KEY: "sk_test_secret" }),
  );
  assert.throws(() => configuration({ ...env, PAYMENTS_MODE: "live" }));
  assert.throws(() =>
    configuration({ ...env, PUBLIC_APP_URL: "http://demo.example.com" }),
  );
});
