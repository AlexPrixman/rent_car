import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixture, rental, assetData, extraVehicle } from "./helpers.js";
import { configuration } from "../lib/config.js";
import { createApp } from "../app.js";
import { seed } from "../lib/seed.js";

test("missing JSON fields, arrays, and past pickup dates produce validation errors", async (t) => {
  const f = await fixture(t);
  await f.employee.post("/api/customers").send({}).expect(400);
  await f.employee.post("/api/vehicles").send([]).expect(400);
  await f.employee
    .post("/api/rentals")
    .send({ ...assetData(f), startDate: "2020-01-01", endDate: "2020-01-02" })
    .expect(400);
});

test("definitively rejected checkout creation unlocks an unpaid reservation", async (t) => {
  const gateways = {
    enabled: () => true,
    create: async () => {
      const error = new Error("Provider validation failure");
      error.statusCode = 400;
      throw error;
    },
  };
  const f = await fixture(t, { mode: "sandbox" }, { gateways }),
    r = await rental(f, "stripe");
  await f.employee
    .post(`/api/rentals/${r.id}/payments/link`)
    .send({})
    .expect(400);
  assert.equal(f.service.rental(r.id).payments[0].status, "failed");
  await f.employee
    .patch(`/api/rentals/${r.id}`)
    .send({ ...assetData(f), paymentMethod: "cash" })
    .expect(200);
});

test("sessions require login, hide credentials, and logout revokes access", async (t) => {
  const f = await fixture(t);
  await f.request.get("/api/customers").expect(401);
  await f.request
    .post("/api/auth/login")
    .send({ username: "manager", password: "incorrect" })
    .expect(401);
  const me = (await f.employee.get("/api/auth/me").expect(200)).body;
  assert.deepEqual(Object.keys(me).sort(), [
    "active",
    "id",
    "name",
    "role",
    "username",
  ]);
  await f.employee.post("/api/auth/logout").send({}).expect(204);
  await f.employee.get("/api/rentals").expect(401);
});
test("server enforces manager-only employee list/create/edit", async (t) => {
  const f = await fixture(t),
    id = f.service.get("SELECT id FROM users WHERE username='employee'").id;
  for (const call of [
    () => f.employee.get("/api/employees"),
    () => f.employee.post("/api/employees").send({ name: "Intruder" }),
    () => f.employee.patch(`/api/employees/${id}`).send({ role: "Manager" }),
  ])
    await call().expect(403);
  const newUser = (
    await f.manager
      .post("/api/employees")
      .send({
        username: "newstaff",
        name: "New Staff",
        role: "Employee",
        password: "NewPassword123!",
      })
      .expect(201)
  ).body;
  await f.manager
    .patch(`/api/employees/${newUser.id}`)
    .send({ name: "Staff Edited", role: "Manager", active: true, password: "" })
    .expect(200);
  const staff = request.agent(f.app);
  await staff
    .post("/api/auth/login")
    .send({ username: "newstaff", password: "NewPassword123!" })
    .expect(200);
  await staff.get("/api/employees").expect(200);
  await f.manager
    .patch(`/api/employees/${newUser.id}`)
    .send({ name: "Staff Edited", role: "Employee", active: true })
    .expect(200);
  await staff.get("/api/employees").expect(403);
});
test("deactivation and password reset immediately revoke employee sessions", async (t) => {
  const f = await fixture(t),
    id = f.service.get("SELECT id FROM users WHERE username='employee'").id;
  await f.manager
    .patch(`/api/employees/${id}`)
    .send({
      name: "Jamie",
      role: "Employee",
      active: true,
      password: "ResetPassword123!",
    })
    .expect(200);
  await f.employee.get("/api/customers").expect(401);
  await f.employee
    .post("/api/auth/login")
    .send({ username: "employee", password: "RentDesk123!" })
    .expect(401);
  await f.employee
    .post("/api/auth/login")
    .send({ username: "employee", password: "ResetPassword123!" })
    .expect(200);
  await f.manager
    .patch(`/api/employees/${id}`)
    .send({ name: "Jamie", role: "Employee", active: false })
    .expect(200);
  await f.employee.get("/api/vehicles").expect(401);
  await f.employee
    .post("/api/auth/login")
    .send({ username: "employee", password: "ResetPassword123!" })
    .expect(401);
});
test("manager cannot demote or deactivate themselves; inputs and uniqueness are checked", async (t) => {
  const f = await fixture(t),
    id = f.service.get("SELECT id FROM users WHERE username='manager'").id;
  for (const patch of [
    { role: "Employee", active: true },
    { role: "Manager", active: false },
  ])
    await f.manager
      .patch(`/api/employees/${id}`)
      .send({ name: "Alex", ...patch })
      .expect(409);
  await f.manager
    .post("/api/employees")
    .send({
      username: "manager",
      name: "Duplicate",
      role: "Employee",
      password: "RentDesk123!",
    })
    .expect(409);
  await f.manager
    .post("/api/employees")
    .send({
      username: "okstaff",
      name: "Person",
      role: "Admin",
      password: "RentDesk123!",
    })
    .expect(400);
});
test("employees can create/edit/search/archive customers and vehicles", async (t) => {
  const f = await fixture(t);
  const c = (
    await f.employee
      .post("/api/customers")
      .send({
        name: "Sam Example",
        email: "sam@example.com",
        phone: "555-0182",
        licenseNumber: "SAM-123",
      })
      .expect(201)
  ).body;
  await f.employee
    .post("/api/customers")
    .send({ name: "Other", phone: "555", licenseNumber: "sam-123" })
    .expect(409);
  await f.employee
    .patch(`/api/customers/${c.id}`)
    .send({ ...c, name: "Sam Updated", active: false })
    .expect(200);
  assert.equal(
    (await f.employee.get("/api/customers?q=Sam")).body.items[0].name,
    "Sam Updated",
  );
  const v = await extraVehicle(f);
  await f.employee
    .patch(`/api/vehicles/${v.id}`)
    .send({ ...v, dailyRate: "65.99", status: "retired" })
    .expect(200);
  const updated = (await f.employee.get(`/api/vehicles?q=${v.plate}`)).body
    .items[0];
  assert.equal(updated.dailyRateCents, 6599);
  assert.equal(updated.status, "retired");
  await f.employee
    .post("/api/vehicles")
    .send({ ...v, dailyRate: "1.999" })
    .expect(400);
});
test("rental cash → pickup → return works and preserves snapshot pricing", async (t) => {
  const f = await fixture(t),
    r = await rental(f);
  assert.equal(r.totalCents, 9000);
  assert.equal(r.days, 2);
  await f.employee
    .post(`/api/rentals/${r.id}/pickup`)
    .send({ odometer: 12500 })
    .expect(409);
  await f.employee
    .post(`/api/rentals/${r.id}/payments/cash`)
    .send({ received: false })
    .expect(400);
  await f.employee
    .post(`/api/rentals/${r.id}/payments/cash`)
    .send({ received: true, reference: "CASH-001" })
    .expect(200);
  const repeated = (
    await f.employee
      .post(`/api/rentals/${r.id}/payments/cash`)
      .send({ received: true })
      .expect(200)
  ).body;
  assert.equal(repeated.payments.length, 1);
  const v = f.service.required("vehicles", r.vehicleId);
  await f.employee
    .patch(`/api/vehicles/${v.id}`)
    .send({
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      dailyRate: "99.99",
      status: "available",
      odometer: v.odometer,
    })
    .expect(200);
  await f.employee
    .patch(`/api/rentals/${r.id}`)
    .send({
      ...assetData(f),
      endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    })
    .expect(409);
  await f.employee
    .post(`/api/rentals/${r.id}/pickup`)
    .send({ odometer: 12500 })
    .expect(200);
  await f.employee
    .post(`/api/rentals/${r.id}/return`)
    .send({ odometer: 12499 })
    .expect(400);
  const done = (
    await f.employee
      .post(`/api/rentals/${r.id}/return`)
      .send({ odometer: 12700 })
      .expect(200)
  ).body;
  assert.equal(done.status, "completed");
  assert.equal(done.totalCents, 9000);
  assert.equal(f.service.required("vehicles", v.id).odometer, 12700);
  await f.employee
    .post(`/api/rentals/${r.id}/return`)
    .send({ odometer: 12800 })
    .expect(409);
});
test("atomic reservations prevent overlap; adjacent dates are allowed", async (t) => {
  const f = await fixture(t),
    body = assetData(f);
  const attempts = await Promise.all([
    f.employee.post("/api/rentals").send(body),
    f.manager.post("/api/rentals").send(body),
  ]);
  assert.deepEqual(attempts.map((r) => r.status).sort(), [201, 409]);
  await f.employee
    .post("/api/rentals")
    .send({
      ...body,
      startDate: body.endDate,
      endDate: new Date(Date.parse(body.endDate) + 86400000)
        .toISOString()
        .slice(0, 10),
    })
    .expect(201);
});
test("open rentals block customer archive and vehicle retirement; cancellation releases dates", async (t) => {
  const f = await fixture(t),
    r = await rental(f),
    c = f.service.required("customers", r.customerId),
    v = f.service.required("vehicles", r.vehicleId);
  await f.employee
    .patch(`/api/customers/${c.id}`)
    .send({
      name: c.name,
      email: c.email,
      phone: c.phone,
      licenseNumber: c.license_number,
      active: false,
    })
    .expect(409);
  await f.employee
    .patch(`/api/vehicles/${v.id}`)
    .send({
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      dailyRate: "45",
      status: "retired",
      odometer: v.odometer,
    })
    .expect(409);
  await f.employee.post(`/api/rentals/${r.id}/cancel`).send({}).expect(200);
  await f.employee.post("/api/rentals").send(assetData(f)).expect(201);
});
test("unpaid reservations can be edited; snapshots change with selected customer/vehicle", async (t) => {
  const f = await fixture(t),
    r = await rental(f),
    v = await extraVehicle(f);
  const changed = (
    await f.employee
      .patch(`/api/rentals/${r.id}`)
      .send({ ...assetData(f), vehicleId: v.id, notes: "Meet at desk" })
      .expect(200)
  ).body;
  assert.equal(changed.vehicleLabel, "Honda Civic");
  assert.equal(changed.totalCents, 11020);
  assert.equal(changed.notes, "Meet at desk");
});
test("demo Stripe and PayPal links settle idempotently without exposing customer data", async (t) => {
  const f = await fixture(t);
  for (const method of ["stripe", "paypal"]) {
    const r = await rental(f, method);
    const links = await Promise.all([
      f.employee.post(`/api/rentals/${r.id}/payments/link`).send({}),
      f.manager.post(`/api/rentals/${r.id}/payments/link`).send({}),
    ]);
    assert.ok(links.every((l) => l.status === 200));
    assert.equal(links[0].body.id, links[1].body.id);
    const token = new URL(links[0].body.checkoutUrl).pathname.split("/").at(-1);
    const summary = (await f.request.get(`/api/checkout/${token}`).expect(200))
      .body;
    assert.equal(summary.payment.status, "pending");
    assert.equal(summary.customerName, undefined);
    await f.request.post(`/api/checkout/${token}/demo`).send({}).expect(200);
    await f.request.post(`/api/checkout/${token}/demo`).send({}).expect(200);
    assert.equal(f.service.rental(r.id).payments.length, 1);
    assert.equal(f.service.rental(r.id).payments[0].status, "paid");
    await f.employee.post(`/api/rentals/${r.id}/cancel`).send({}).expect(200);
    assert.equal(f.service.rental(r.id).payments[0].status, "paid");
  }
});
test("cancelled links cannot be used; pending links lock terms until cancelled", async (t) => {
  const f = await fixture(t),
    r = await rental(f, "stripe"),
    link = (
      await f.employee.post(`/api/rentals/${r.id}/payments/link`).send({})
    ).body;
  await f.employee
    .patch(`/api/rentals/${r.id}`)
    .send({ ...assetData(f), paymentMethod: "cash" })
    .expect(409);
  await f.employee
    .post(`/api/rentals/${r.id}/payments/cancel`)
    .send({})
    .expect(200);
  await f.request
    .post(
      `/api/checkout/${new URL(link.checkoutUrl).pathname.split("/").at(-1)}/demo`,
    )
    .send({})
    .expect(409);
  await f.employee
    .patch(`/api/rentals/${r.id}`)
    .send({ ...assetData(f), paymentMethod: "cash" })
    .expect(200);
});
test("failed provider creation retries reuse the payment and idempotency key", async (t) => {
  let calls = 0;
  const ids = [];
  const gateways = {
    enabled: () => true,
    create: async (p) => {
      ids.push(p.id);
      if (++calls === 1) throw new Error("network timeout");
      return {
        externalId: "cs_test_retry",
        url: "https://checkout.stripe.com/test",
      };
    },
  };
  const f = await fixture(t, { mode: "sandbox" }, { gateways }),
    r = await rental(f, "stripe");
  await f.employee
    .post(`/api/rentals/${r.id}/payments/link`)
    .send({})
    .expect(502);
  await f.employee.post(`/api/rentals/${r.id}/cancel`).send({}).expect(409);
  await f.employee
    .post(`/api/rentals/${r.id}/payments/link`)
    .send({})
    .expect(200);
  assert.equal(ids[0], ids[1]);
  assert.equal(f.service.rental(r.id).payments.length, 1);
});
test("unconfigured real providers are unavailable and demo routes are disabled in sandbox", async (t) => {
  const f = await fixture(t, { mode: "sandbox" }),
    r = await rental(f, "stripe");
  await f.employee
    .post(`/api/rentals/${r.id}/payments/link`)
    .send({})
    .expect(503);
  assert.equal(f.service.rental(r.id).payments.length, 0);
  await f.request
    .post(`/api/checkout/${"a".repeat(64)}/demo`)
    .send({})
    .expect(404);
});
test("same-origin checks reject cross-site mutations before changing data", async (t) => {
  const f = await fixture(t);
  await f.employee
    .post("/api/customers")
    .set("Origin", "https://attacker.example")
    .send({ name: "Bad", phone: "555", licenseNumber: "BAD" })
    .expect(403);
  await f.employee
    .post("/api/auth/logout")
    .set("Sec-Fetch-Site", "cross-site")
    .send({})
    .expect(403);
  await f.employee.get("/api/auth/me").expect(200);
});
test("records and session cookies survive an API restart on the same SQLite database", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentdesk-persist-")),
    config = configuration({ DATABASE_PATH: join(dir, "db.sqlite") });
  let runtime = createApp(config, { loginLimit: 1000 });
  try {
    await seed(runtime.db, config);
    const login = await request(runtime.app)
      .post("/api/auth/login")
      .send({ username: "manager", password: "RentDesk123!" })
      .expect(200);
    const cookie = login.headers["set-cookie"][0].split(";")[0];
    assert.match(login.headers["set-cookie"][0], /HttpOnly/);
    assert.match(login.headers["set-cookie"][0], /SameSite=Lax/);
    runtime.close();
    runtime = createApp(config, { loginLimit: 1000 });
    const records = (
      await request(runtime.app)
        .get("/api/customers")
        .set("Cookie", cookie)
        .expect(200)
    ).body;
    assert.equal(records.total, 2);
  } finally {
    runtime.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
