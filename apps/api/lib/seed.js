import { RentalService } from "./domain.js";
import { password, fail } from "./validation.js";

export async function seed(db, config, env = process.env) {
  const s = new RentalService(db, config);
  if (config.production) {
    const name = env.SEED_MANAGER_USERNAME || "manager";
    if (!env.SEED_MANAGER_PASSWORD || env.SEED_MANAGER_PASSWORD.length < 12)
      fail(
        400,
        "Set SEED_MANAGER_PASSWORD to a unique password of at least 12 characters",
      );
    password(env.SEED_MANAGER_PASSWORD);
    if (!s.get("SELECT id FROM users WHERE username=?", name))
      await s.createUser(
        {
          username: name,
          name: "Manager",
          role: "Manager",
          password: env.SEED_MANAGER_PASSWORD,
        },
        null,
      );
    return;
  }
  if (s.get("SELECT id FROM users LIMIT 1")) return;
  const manager = await s.createUser(
    {
      username: "manager",
      name: "Alex Morgan",
      role: "Manager",
      password: "RentDesk123!",
    },
    null,
  );
  await s.createUser(
    {
      username: "employee",
      name: "Jamie Rivera",
      role: "Employee",
      password: "RentDesk123!",
    },
    manager.id,
  );
  for (const c of [
    {
      name: "Taylor Brooks",
      email: "taylor@example.com",
      phone: "+1 555 010 1001",
      licenseNumber: "DEMO-1001",
    },
    {
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "+1 555 010 1002",
      licenseNumber: "DEMO-1002",
    },
  ])
    s.createCustomer(c, manager.id);
  for (const v of [
    {
      plate: "RD-100",
      make: "Toyota",
      model: "Corolla",
      year: 2024,
      category: "Sedan",
      dailyRate: "45.00",
      status: "available",
      odometer: 12500,
    },
    {
      plate: "RD-200",
      make: "Kia",
      model: "Sportage",
      year: 2025,
      category: "SUV",
      dailyRate: "75.00",
      status: "available",
      odometer: 6800,
    },
    {
      plate: "RD-300",
      make: "Volkswagen",
      model: "Golf",
      year: 2023,
      category: "Compact",
      dailyRate: "39.00",
      status: "maintenance",
      odometer: 31000,
    },
  ])
    s.createVehicle(v, manager.id);
}
