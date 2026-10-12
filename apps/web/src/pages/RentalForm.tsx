import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  api,
  money,
  send,
  today,
  tomorrow,
  useDebounced,
  useResource,
} from "../api";
import { ErrorPanel, PageHead } from "../components";
import type { Config, Customer, List, Rental, Vehicle } from "../types";
type Quote = {
  days: number;
  dailyRateCents: number;
  totalCents: number;
  currency: string;
};
export function BookingForm({ rental }: { rental?: Rental }) {
  const navigate = useNavigate(),
    [customerSearch, setCustomerSearch] = useState(""),
    [vehicleSearch, setVehicleSearch] = useState(""),
    cq = useDebounced(customerSearch),
    vq = useDebounced(vehicleSearch);
  const customers = useResource<List<Customer>>(
      `/customers?active=true&pageSize=100&q=${encodeURIComponent(cq)}`,
    ),
    vehicles = useResource<List<Vehicle>>(
      `/vehicles?status=available&pageSize=100&q=${encodeURIComponent(vq)}`,
    ),
    config = useResource<Config>("/config");
  const [form, setForm] = useState({
    customerId: rental?.customerId || "",
    vehicleId: rental?.vehicleId || "",
    startDate: rental?.startDate || today(),
    endDate: rental?.endDate || tomorrow(),
    paymentMethod: rental?.paymentMethod || "cash",
    notes: rental?.notes || "",
  });
  const [quote, setQuote] = useState<Quote | null>(null),
    [quoteError, setQuoteError] = useState(""),
    [quoting, setQuoting] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const locked = Boolean(
    rental &&
    (rental.status !== "reserved" ||
      rental.payments.some((p) =>
        ["creating", "pending", "processing", "paid"].includes(p.status),
      )),
  );
  useEffect(() => {
    if (locked || !form.vehicleId) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    setQuoting(true);
    setQuote(null);
    setQuoteError("");
    api<Quote>("/rentals/quote", {
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({
        vehicleId: form.vehicleId,
        startDate: form.startDate,
        endDate: form.endDate,
        rentalId: rental?.id,
      }),
    })
      .then((q) => {
        if (!controller.signal.aborted) setQuote(q);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setQuoteError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoting(false);
      });
    return () => controller.abort();
  }, [form.vehicleId, form.startDate, form.endDate, locked, rental?.id]);
  const amount = locked ? rental : quote;
  return (
    <form
      className="booking-layout"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          const saved = await send<Rental>(
            `/rentals${rental ? `/${rental.id}` : ""}`,
            locked ? { notes: form.notes } : form,
            rental ? "PATCH" : "POST",
          );
          navigate(`/rentals/${saved.id}`);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="panel booking-form">
        <h2>Rental details</h2>
        {error && <ErrorPanel error={error} />}{" "}
        {locked && (
          <div className="notice">
            Rental terms are locked after payment or checkout creation. You can
            still update notes. Cancel an unpaid link from the rental screen
            before changing terms.
          </div>
        )}
        <fieldset disabled={busy}>
          <fieldset disabled={locked}>
            <div className="form-grid">
              <label>
                Find customer
                <input
                  type="search"
                  placeholder="Search name, license, or phone"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </label>
              <label>
                Find vehicle
                <input
                  type="search"
                  placeholder="Search make, model, or plate"
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                />
              </label>
              <label>
                Customer
                <select
                  aria-label="Customer"
                  value={form.customerId}
                  onChange={(e) =>
                    setForm({ ...form, customerId: e.target.value })
                  }
                  required
                >
                  <option value="">
                    {customers.loading
                      ? "Loading customers…"
                      : "Choose a customer"}
                  </option>
                  {rental &&
                    !customers.data?.items.some(
                      (c) => c.id === rental.customerId,
                    ) && (
                      <option value={rental.customerId}>
                        {rental.customerName}
                      </option>
                    )}
                  {customers.data?.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.licenseNumber}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Vehicle
                <select
                  aria-label="Vehicle"
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm({ ...form, vehicleId: e.target.value })
                  }
                  required
                >
                  <option value="">
                    {vehicles.loading
                      ? "Loading vehicles…"
                      : "Choose a vehicle"}
                  </option>
                  {rental &&
                    !vehicles.data?.items.some(
                      (v) => v.id === rental.vehicleId,
                    ) && (
                      <option value={rental.vehicleId}>
                        {rental.vehicleLabel} · {rental.plate}
                      </option>
                    )}
                  {vehicles.data?.items.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} · {v.plate} ·{" "}
                      {money(v.dailyRateCents, v.currency)}/day
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pickup date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Return date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  required
                />
              </label>
            </div>
            <label className="payment-method">
              Payment method
              <select
                aria-label="Payment method"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentMethod: e.target.value as Rental["paymentMethod"],
                  })
                }
              >
                <option value="cash">Cash</option>
                <option
                  value="stripe"
                  disabled={!config.data?.providers.stripe}
                >
                  Stripe checkout link
                  {!config.data?.providers.stripe ? " (not configured)" : ""}
                </option>
                <option
                  value="paypal"
                  disabled={!config.data?.providers.paypal}
                >
                  PayPal checkout link
                  {!config.data?.providers.paypal ? " (not configured)" : ""}
                </option>
              </select>
            </label>
            <p className="form-hint">
              The return date is exclusive. A pickup on Monday and return on
              Tuesday is one rental day. Availability is checked when you save.
            </p>
            {customers.error && (
              <ErrorPanel error={customers.error} retry={customers.reload} />
            )}{" "}
            {vehicles.error && (
              <ErrorPanel error={vehicles.error} retry={vehicles.reload} />
            )}{" "}
            {config.error && (
              <ErrorPanel error={config.error} retry={config.reload} />
            )}
          </fieldset>
          <label>
            Notes <span className="optional">(optional)</span>
            <textarea
              rows={3}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Pickup arrangements or other details…"
            />
          </label>
          <footer className="form-actions">
            <Link
              className="button secondary"
              to={rental ? `/rentals/${rental.id}` : "/rentals"}
            >
              Cancel
            </Link>
            <button
              className="primary"
              disabled={busy || (!locked && (!quote || quoting))}
            >
              {busy
                ? "Saving…"
                : rental
                  ? "Save changes"
                  : "Create reservation"}
            </button>
          </footer>
        </fieldset>
      </section>
      <aside className="panel booking-summary">
        <p className="eyebrow">RENTAL SUMMARY</p>
        <h2>
          A clear price.
          <br />A smooth handover.
        </h2>
        {quoteError && <ErrorPanel error={quoteError} />}{" "}
        {quoting && <p role="status">Checking availability…</p>}
        <dl>
          <div>
            <dt>Daily rate</dt>
            <dd>
              {amount ? money(amount.dailyRateCents, amount.currency) : "—"}
            </dd>
          </div>
          <div>
            <dt>Rental days</dt>
            <dd>{amount?.days ?? "—"}</dd>
          </div>
          <div className="total-line">
            <dt>Total</dt>
            <dd>{amount ? money(amount.totalCents, amount.currency) : "—"}</dd>
          </div>
        </dl>
        <p className="form-hint">
          {rental
            ? "Your booked rate is preserved after payment."
            : "Daily rates are saved with the reservation."}{" "}
          Payment is recorded separately. Pickup requires full payment.
        </p>
        {config.data?.paymentMode === "demo" && (
          <div className="demo-note">
            Online checkout is in demo mode. No real charges.
          </div>
        )}
      </aside>
    </form>
  );
}
export default function RentalForm() {
  const { id } = useParams(),
    resource = useResource<Rental>(id ? `/rentals/${id}` : null);
  return (
    <>
      <PageHead
        eyebrow="RENTAL OPERATIONS"
        title={id ? "Edit rental" : "New rental"}
        description="Choose a customer, an available vehicle, and the rental dates."
      />
      {resource.error ? (
        <ErrorPanel error={resource.error} retry={resource.reload} />
      ) : id && !resource.data ? (
        <p role="status">Loading rental…</p>
      ) : (
        <BookingForm
          key={resource.data?.id || "new"}
          rental={resource.data || undefined}
        />
      )}
    </>
  );
}
