import { render, screen, waitFor, act } from "@testing-library/react";
import { api, ApiError, money, useResource } from "../api";
const response = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;
afterEach(() => vi.unstubAllGlobals());
test("API errors preserve server feedback and expire staff sessions", async () => {
  const listener = vi.fn();
  window.addEventListener("session-expired", listener);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(response({ error: "Please sign in" }, 401)),
  );
  await expect(api("/customers")).rejects.toEqual(
    new ApiError(401, "Please sign in"),
  );
  expect(listener).toHaveBeenCalledTimes(1);
  window.removeEventListener("session-expired", listener);
});
test("failed sign-in does not trigger a session-expired event", async () => {
  const listener = vi.fn();
  window.addEventListener("session-expired", listener);
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        response({ error: "Invalid username or password" }, 401),
      ),
  );
  await expect(api("/auth/login")).rejects.toThrow(
    "Invalid username or password",
  );
  expect(listener).not.toHaveBeenCalled();
  window.removeEventListener("session-expired", listener);
});
test("superseded and unmounted requests cannot overwrite current data", async () => {
  const pending: { resolve: (r: Response) => void; signal: AbortSignal }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_path: string, init: RequestInit) =>
        new Promise<Response>((resolve) =>
          pending.push({ resolve, signal: init.signal as AbortSignal }),
        ),
    ),
  );
  function Probe({ path }: { path: string }) {
    const r = useResource<{ name: string }>(path);
    return <span>{r.data?.name || "Loading"}</span>;
  }
  const view = render(<Probe path="/customers?q=old" />);
  view.rerender(<Probe path="/customers?q=new" />);
  expect(pending[0].signal.aborted).toBe(true);
  await act(async () => pending[1].resolve(response({ name: "new customer" })));
  expect(screen.getByText("new customer")).toBeInTheDocument();
  await act(async () =>
    pending[0].resolve(response({ name: "stale customer" })),
  );
  expect(screen.queryByText("stale customer")).not.toBeInTheDocument();
  view.unmount();
  expect(pending[1].signal.aborted).toBe(true);
});
test("a failed read can be retried without remounting the page", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce(response({ name: "Recovered" })),
  );
  function Probe() {
    const r = useResource<{ name: string }>("/customers");
    return (
      <>
        <span>{r.error || r.data?.name || "Loading"}</span>
        <button onClick={r.reload}>Retry</button>
      </>
    );
  }
  render(<Probe />);
  await screen.findByText("Offline");
  screen.getByRole("button", { name: "Retry" }).click();
  await waitFor(() =>
    expect(screen.getByText("Recovered")).toBeInTheDocument(),
  );
});
test("money formatting preserves cents and business currency", () => {
  expect(money(6599, "USD")).toBe("$65.99");
  expect(money(1, "EUR")).toBe("€0.01");
});

test("switching record URLs clears the old record before the next response", async () => {
  let resolveNext: (response: Response) => void = () => {};
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(response({ name: "Rental 1000" }))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveNext = resolve;
          }),
      ),
  );
  function Probe({ path }: { path: string }) {
    const r = useResource<{ name: string }>(path);
    return <span>{r.data?.name || "Loading record"}</span>;
  }
  const view = render(<Probe path="/rentals/first" />);
  await screen.findByText("Rental 1000");
  view.rerender(<Probe path="/rentals/second" />);
  expect(screen.queryByText("Rental 1000")).not.toBeInTheDocument();
  await act(async () => resolveNext(response({ name: "Rental 1001" })));
  expect(screen.getByText("Rental 1001")).toBeInTheDocument();
});
