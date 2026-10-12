import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Records from "../pages/Records";
import { BookingForm } from "../pages/RentalForm";
import { Modal } from "../components";
import Login from "../pages/Login";
import { AuthProvider } from "../auth";
const config = {
  currency: "USD",
  paymentMode: "demo",
  demoLogin: true,
  providers: { cash: true, stripe: true, paypal: true },
};
const customer = {
  id: "customer-1",
  name: "Jordan Lee",
  email: "jordan@example.com",
  phone: "555",
  licenseNumber: "DEMO-1002",
  active: true,
};
const vehicle = {
  id: "vehicle-1",
  make: "Toyota",
  model: "Corolla",
  plate: "RD-100",
  dailyRateCents: 4500,
  currency: "USD",
};
const response = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;
function mockReads(
  handler?: (path: string, init: RequestInit) => Response | undefined,
) {
  const fn = vi.fn(
    async (path: string, init: RequestInit) =>
      handler?.(path, init) ||
      response(
        path.includes("/config")
          ? config
          : path.includes("/customers")
            ? { items: [customer], total: 1, page: 1, pageSize: 20 }
            : path.includes("/vehicles")
              ? { items: [vehicle] }
              : {},
      ),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}
afterEach(() => vi.unstubAllGlobals());
test("customer create failures keep entered values and allow a corrected retry", async () => {
  let attempts = 0;
  const fetcher = mockReads((path, init) =>
    path === "/api/customers" && init.method === "POST"
      ? response(
          ++attempts === 1
            ? { error: "Driver license already exists" }
            : { id: "new-customer" },
          attempts === 1 ? 409 : 201,
        )
      : undefined,
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Records kind="customers" />
    </MemoryRouter>,
  );
  await screen.findByText("Jordan Lee");
  await user.click(screen.getByRole("button", { name: "Add customer" }));
  const dialog = screen.getByRole("dialog", { name: "Add customer" });
  await user.type(within(dialog).getByLabelText("Full name"), "Sam Demo");
  await user.type(within(dialog).getByLabelText("Phone"), "555-1234");
  await user.type(within(dialog).getByLabelText("Driver license"), "DEMO-1002");
  await user.click(
    within(dialog).getByRole("button", { name: "Save customer" }),
  );
  await screen.findByText("Driver license already exists");
  expect(within(dialog).getByLabelText("Full name")).toHaveValue("Sam Demo");
  await user.clear(within(dialog).getByLabelText("Driver license"));
  await user.type(within(dialog).getByLabelText("Driver license"), "NEW-123");
  await user.click(
    within(dialog).getByRole("button", { name: "Save customer" }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(attempts).toBe(2);
  const call = fetcher.mock.calls
    .filter(
      ([path, init]) => path === "/api/customers" && init.method === "POST",
    )
    .at(-1);
  expect(JSON.parse(call![1].body as string).licenseNumber).toBe("NEW-123");
});
test("booking conflicts disable reservation submission and show the server reason", async () => {
  mockReads((path) =>
    path === "/api/rentals/quote"
      ? response(
          { error: "Vehicle is unavailable: rental #1000 overlaps" },
          409,
        )
      : undefined,
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <BookingForm />
    </MemoryRouter>,
  );
  await screen.findByRole("option", { name: /Toyota Corolla/ });
  await user.selectOptions(screen.getByLabelText("Customer"), "customer-1");
  await user.selectOptions(screen.getByLabelText("Vehicle"), "vehicle-1");
  await screen.findByText("Vehicle is unavailable: rental #1000 overlaps");
  expect(
    screen.getByRole("button", { name: "Create reservation" }),
  ).toBeDisabled();
});
test("booking quote displays exact total and enables a valid reservation", async () => {
  mockReads((path) =>
    path === "/api/rentals/quote"
      ? response({
          days: 2,
          dailyRateCents: 4500,
          totalCents: 9000,
          currency: "USD",
        })
      : undefined,
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <BookingForm />
    </MemoryRouter>,
  );
  await screen.findByRole("option", { name: /Toyota Corolla/ });
  await user.selectOptions(screen.getByLabelText("Vehicle"), "vehicle-1");
  await screen.findByText("$90.00");
  expect(
    screen.getByRole("button", { name: "Create reservation" }),
  ).toBeEnabled();
  expect(
    screen.getByText("Online checkout is in demo mode. No real charges."),
  ).toBeInTheDocument();
});
test("modal keeps keyboard focus inside and Escape dismisses it", async () => {
  const onClose = vi.fn(),
    user = userEvent.setup();
  render(
    <Modal title="Edit customer" onClose={onClose}>
      <label>
        Name
        <input />
      </label>
      <button>Save</button>
    </Modal>,
  );
  expect(screen.getByRole("textbox")).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
});
test("login shows useful errors and keeps the entered username", async () => {
  mockReads((path) =>
    path === "/api/auth/me"
      ? response({ error: "Please sign in" }, 401)
      : path === "/api/auth/login"
        ? response({ error: "Invalid username or password" }, 401)
        : undefined,
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled(),
  );
  await user.type(screen.getByLabelText("Username"), "employee");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByText("Invalid username or password");
  expect(screen.getByLabelText("Username")).toHaveValue("employee");
  expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
});
