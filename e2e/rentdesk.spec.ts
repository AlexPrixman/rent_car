import { test as base, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const unique = () => randomUUID().slice(0, 8);
async function login(
  page: Page,
  username = "manager",
  password = "RentDesk123!",
) {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
}
async function vehicle(page: Page) {
  const plate = `E2E-${unique()}`.toUpperCase();
  await page.getByRole("link", { name: "Vehicles", exact: true }).click();
  await page.getByRole("button", { name: "Add vehicle" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("License plate", { exact: true }).fill(plate);
  await modal.getByLabel("Make", { exact: true }).fill("Honda");
  await modal.getByLabel("Model", { exact: true }).fill("Civic");
  await modal.getByLabel("Category", { exact: true }).fill("Sedan");
  await modal.getByLabel("Daily rate", { exact: true }).fill("55.10");
  await modal.getByLabel("Odometer", { exact: true }).fill("1000");
  await modal.getByRole("button", { name: "Save vehicle" }).click();
  await expect(modal).toBeHidden();
  return plate;
}
async function booking(page: Page, plate: string, method = "cash") {
  await page.goto("/rentals/new");
  await page.getByLabel("Find vehicle", { exact: true }).fill(plate);
  const option = page.getByRole("option", { name: new RegExp(plate) });
  await expect(option).toBeAttached();
  await page
    .getByLabel("Vehicle", { exact: true })
    .selectOption({ label: (await option.textContent()) || "" });
  await page
    .getByLabel("Customer", { exact: true })
    .selectOption({ label: "Taylor Brooks · DEMO-1001" });
  const start = new Date().toISOString().slice(0, 10),
    end = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel("Pickup date", { exact: true }).fill(start);
  await page.getByLabel("Return date", { exact: true }).fill(end);
  await page.getByLabel("Payment method", { exact: true }).selectOption(method);
  await expect(
    page.getByRole("button", { name: "Create reservation" }),
  ).toBeEnabled();
  await expect(page.getByText("$110.20", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create reservation" }).click();
  await expect(page.getByRole("heading", { name: /Rental #/ })).toBeVisible();
  return page.url();
}
test("employee workspace enforces permissions and allows customer and fleet management", async ({
  page,
}) => {
  await login(page, "employee");
  await expect(
    page.getByRole("link", { name: "Employees", exact: true }),
  ).toHaveCount(0);
  expect((await page.request.get("/api/employees")).status()).toBe(403);
  expect(
    (
      await page.request.post("/api/employees", { data: { name: "Bad" } })
    ).status(),
  ).toBe(403);
  await page.goto("/employees");
  await expect(
    page.getByRole("heading", { name: "Manager access required" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await page.getByRole("button", { name: "Add customer" }).click();
  const dialog = page.getByRole("dialog");
  const name = `E2E Customer ${unique()}`;
  await dialog.getByLabel("Full name", { exact: true }).fill(name);
  await dialog.getByLabel("Phone", { exact: true }).fill("555-0109");
  await dialog
    .getByLabel("Driver license", { exact: true })
    .fill(`LIC-${unique()}`);
  await dialog.getByRole("button", { name: "Save customer" }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("searchbox", { name: "Search customers" }).fill(name);
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await dialog.getByLabel("Phone", { exact: true }).fill("555-0200");
  await dialog.getByRole("button", { name: "Save customer" }).click();
  await expect(page.getByText("555-0200", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await dialog.getByLabel("Customer active", { exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Save customer" }).click();
  await expect(page.getByText("archived", { exact: true })).toBeVisible();
  await vehicle(page);
});
test("manager creates, edits, and deactivates employee accounts", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Add employee" }).click();
  const dialog = page.getByRole("dialog"),
    username = `staff${unique()}`,
    name = `Staff ${unique()}`;
  await dialog.getByLabel("Full name", { exact: true }).fill(name);
  await dialog.getByLabel("Username", { exact: true }).fill(username);
  await dialog
    .getByLabel("Password", { exact: true })
    .fill("StaffPassword123!");
  await dialog.getByRole("button", { name: "Save employee" }).click();
  await expect(dialog).toBeHidden();
  const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4001",
    }),
    staff = await context.newPage();
  try {
    await login(staff, username, "StaffPassword123!");
    await page.getByRole("button", { name: `Edit ${name}` }).click();
    await dialog
      .getByLabel("Full name", { exact: true })
      .fill(`${name} Updated`);
    await dialog.getByLabel("Role", { exact: true }).selectOption("Manager");
    await dialog.getByRole("button", { name: "Save employee" }).click();
    await expect(dialog).toBeHidden();
    expect((await staff.request.get("/api/employees")).status()).toBe(200);
    await page.getByRole("button", { name: `Edit ${name} Updated` }).click();
    await dialog.getByLabel("Account active", { exact: true }).uncheck();
    await dialog.getByRole("button", { name: "Save employee" }).click();
    await expect(dialog).toBeHidden();
    expect((await staff.request.get("/api/customers")).status()).toBe(401);
  } finally {
    await context.close();
  }
});
test("cash reservation runs end to end through pickup, return, and printable receipt", async ({
  page,
}, info) => {
  await login(page, "employee");
  const plate = await vehicle(page);
  await booking(page, plate);
  await expect(
    page.getByRole("button", { name: "Confirm pickup", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Record cash payment", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("I received the full cash amount.").check();
  await dialog.getByLabel("Cash reference").fill(`CASH-${unique()}`);
  await dialog
    .getByRole("button", { name: "Record cash payment", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await page
    .getByRole("button", { name: "Confirm pickup", exact: true })
    .click();
  await dialog.getByLabel("Pickup odometer", { exact: true }).fill("1000");
  await dialog
    .getByRole("button", { name: "Confirm pickup", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText("Vehicle handed over.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Complete return", exact: true })
    .click();
  await dialog.getByLabel("Return odometer", { exact: true }).fill("1123");
  await dialog
    .getByRole("button", { name: "Complete return", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText("Rental completed.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Print record" }).click();
  await expect(
    page.getByRole("heading", { name: "Rental receipt" }),
  ).toBeVisible();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Vehicles", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search vehicles" }).fill(plate);
  await expect(
    page
      .getByRole("row", { name: new RegExp(plate) })
      .getByText("1,123", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
  await expect(page.getByText("Loading rentals…")).toHaveCount(0);
  mkdirSync("docs/screenshots", { recursive: true });
  await page.mouse.move(0, 0);
  await page.screenshot({
    path: `docs/screenshots/dashboard-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
for (const provider of ["stripe", "paypal"])
  test(`${provider} checkout link runs end to end and is explicitly labelled demo`, async ({
    page,
    browser,
  }) => {
    await login(page);
    const plate = await vehicle(page),
      rentalUrl = await booking(page, plate, provider);
    await page.getByRole("button", { name: "Create checkout link" }).click();
    const link = page.getByLabel("Customer payment link", { exact: true });
    await expect(link).toHaveValue(/\/checkout\//);
    const url = await link.inputValue();
    const context = await browser.newContext(),
      buyer = await context.newPage();
    try {
      await buyer.goto(url);
      await expect(
        buyer.getByText(/No card or PayPal account is needed/),
      ).toBeVisible();
      await buyer
        .getByRole("button", { name: "Complete demo payment" })
        .click();
      await expect(
        buyer.getByRole("heading", { name: "Payment received" }),
      ).toBeVisible();
      await page.goto(rentalUrl);
      await expect(
        page.getByText("Payment received", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Confirm pickup", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Confirm pickup", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Complete return", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByLabel("Return odometer", { exact: true })
        .fill("1020");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Complete return", exact: true })
        .click();
      await expect(
        page.getByText("Rental completed.", { exact: true }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
test("overlapping reservation is blocked and cancelled checkout cannot settle", async ({
  page,
  browser,
}) => {
  await login(page);
  const plate = await vehicle(page),
    url = await booking(page, plate, "stripe");
  await page.getByRole("button", { name: "Create checkout link" }).click();
  const checkout = page.getByLabel("Customer payment link", { exact: true });
  await expect(checkout).toHaveValue(/\/checkout\//);
  const checkoutUrl = await checkout.inputValue();
  await page.goto("/rentals/new");
  await page.getByLabel("Find vehicle", { exact: true }).fill(plate);
  const option = page.getByRole("option", { name: new RegExp(plate) });
  await expect(option).toBeAttached();
  await page
    .getByLabel("Vehicle", { exact: true })
    .selectOption({ label: (await option.textContent()) || "" });
  await expect(page.getByRole("alert")).toContainText("Vehicle is unavailable");
  await expect(
    page.getByRole("button", { name: "Create reservation" }),
  ).toBeDisabled();
  await page.goto(url);
  await page
    .getByRole("button", { name: "Cancel rental", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel rental", exact: true })
    .click();
  await expect(
    page.getByText("Rental cancelled.", { exact: true }),
  ).toBeVisible();
  const context = await browser.newContext(),
    buyer = await context.newPage();
  try {
    await buyer.goto(checkoutUrl);
    await expect(
      buyer.getByRole("heading", { name: "Rental cancelled" }),
    ).toBeVisible();
    await expect(
      buyer.getByRole("button", { name: "Complete demo payment" }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
  await booking(page, plate, "cash");
  await page
    .getByRole("button", { name: "Cancel rental", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel rental", exact: true })
    .click();
  await expect(
    page.getByText("Rental cancelled.", { exact: true }),
  ).toBeVisible();
});
test("logout protects deep links and sign-in errors remain actionable", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.goto("/vehicles");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.getByLabel("Username", { exact: true }).fill("employee");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid username or password",
  );
});
