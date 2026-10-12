import request from "supertest";
import { randomUUID } from "node:crypto";
import { configuration } from "../lib/config.js";
import { createApp } from "../app.js";
import { seed } from "../lib/seed.js";

export async function fixture(t, overrides = {}, options = {}) {
  const config = {
    ...configuration({
      DATABASE_PATH: ":memory:",
      PUBLIC_APP_URL: "http://localhost:5173",
    }),
    ...overrides,
  };
  const runtime = createApp(config, { loginLimit: 1000, ...options });
  await seed(runtime.db, config);
  t.after(() => runtime.close());
  const manager = request.agent(runtime.app),
    employee = request.agent(runtime.app);
  await manager
    .post("/api/auth/login")
    .send({ username: "manager", password: "RentDesk123!" })
    .expect(200);
  await employee
    .post("/api/auth/login")
    .send({ username: "employee", password: "RentDesk123!" })
    .expect(200);
  return {
    ...runtime,
    config,
    manager,
    employee,
    request: request(runtime.app),
  };
}
export function assetData(f) {
  const customer = f.service.all("SELECT * FROM customers ORDER BY name")[0];
  const vehicle = f.service.all(
    "SELECT * FROM vehicles WHERE status='available' ORDER BY daily_rate_cents",
  )[0];
  const startDate = new Date().toISOString().slice(0, 10),
    endDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  return {
    customerId: customer.id,
    vehicleId: vehicle.id,
    startDate,
    endDate,
    paymentMethod: "cash",
    notes: "",
  };
}
export async function rental(f, method = "cash") {
  return (
    await f.employee
      .post("/api/rentals")
      .send({ ...assetData(f), paymentMethod: method })
      .expect(201)
  ).body;
}
export async function extraVehicle(f) {
  return (
    await f.employee
      .post("/api/vehicles")
      .send({
        plate: randomUUID().slice(0, 12),
        make: "Honda",
        model: "Civic",
        year: 2024,
        category: "Sedan",
        dailyRate: "55.10",
        status: "available",
        odometer: 1000,
      })
      .expect(201)
  ).body;
}
