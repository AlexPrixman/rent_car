import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { money, send, useResource } from "../api";
import { Badge, ErrorPanel, Modal, PageHead } from "../components";
import type { List, Payment, Rental, Vehicle } from "../types";
type Action = "cash" | "pickup" | "return" | "cancel";
function ActionForm({
  action,
  rental,
  odometer,
  onClose,
  onSaved,
}: {
  action: Action;
  rental: Rental;
  odometer: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [value, setValue] = useState(String(odometer)),
    [reference, setReference] = useState(""),
    [received, setReceived] = useState(false);
  const titles: Record<Action, string> = {
    cash: "Record cash payment",
    pickup: "Confirm pickup",
    return: "Complete return",
    cancel: "Cancel rental",
  };
  const paid = rental.payments.some((p) => p.status === "paid");
  return (
    <Modal title={titles[action]} onClose={onClose} busy={busy}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const path = action === "cash" ? "payments/cash" : action;
            await send(
              `/rentals/${rental.id}/${path}`,
              action === "cash"
                ? { received, reference }
                : action === "cancel"
                  ? {}
                  : { odometer: value },
            );
            onSaved();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && <ErrorPanel error={error} />}
        <fieldset disabled={busy}>
          {action === "cash" ? (
            <>
              <p>
                Record the full payment of{" "}
                <strong>{money(rental.totalCents, rental.currency)}</strong> for
                rental #{rental.number}.
              </p>
              <label>
                Cash reference <span className="optional">(optional)</span>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={120}
                  placeholder="Receipt or register reference"
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={received}
                  onChange={(e) => setReceived(e.target.checked)}
                  required
                />
                I received the full cash amount.
              </label>
            </>
          ) : action === "cancel" ? (
            <>
              <p>
                Cancel rental #{rental.number} and release the vehicle’s
                reserved dates?
              </p>
              {paid && (
                <div className="notice">
                  The payment stays recorded. Review any refund in the
                  Stripe/PayPal dashboard or your cash register. This action
                  does not issue a refund.
                </div>
              )}
            </>
          ) : (
            <>
              <p>
                {action === "pickup"
                  ? "Confirm the handover and current odometer."
                  : "Record the odometer to close this rental and update the fleet record."}
              </p>
              <label>
                {action === "pickup" ? "Pickup" : "Return"} odometer
                <input
                  type="number"
                  min={odometer}
                  max={10000000}
                  step="1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </label>
            </>
          )}
          <footer className="form-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Back
            </button>
            <button
              className={action === "cancel" ? "danger" : "primary"}
              disabled={busy}
            >
              {busy ? "Processing…" : titles[action]}
            </button>
          </footer>
        </fieldset>
      </form>
    </Modal>
  );
}
export default function RentalDetail() {
  const { id } = useParams(),
    resource = useResource<Rental>(`/rentals/${id}`),
    r = resource.data;
  const vehicles = useResource<List<Vehicle>>(
    r ? `/vehicles?q=${encodeURIComponent(r.plate)}` : null,
  );
  const [action, setAction] = useState<Action | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const payment = r?.payments.find((p) =>
    ["creating", "pending", "processing", "paid"].includes(p.status),
  );
  async function paymentAction(path: string) {
    setBusy(true);
    setError("");
    try {
      await send(`/rentals/${id}/payments/${path}`, {});
      setNotice(
        path === "link"
          ? "Checkout link is ready. Share it with the customer."
          : path === "cancel"
            ? "Unpaid checkout link cancelled."
            : "Payment status verified.",
      );
      resource.reload();
    } catch (e) {
      setError((e as Error).message);
      resource.reload();
    } finally {
      setBusy(false);
    }
  }
  if (!r)
    return (
      <>
        {resource.error ? (
          <ErrorPanel error={resource.error} retry={resource.reload} />
        ) : (
          <p role="status">Loading rental…</p>
        )}
      </>
    );
  const odometer =
    vehicles.data?.items.find((v) => v.id === r.vehicleId)?.odometer ??
    r.pickupOdometer ??
    0;
  return (
    <>
      <Link className="back-link" to="/rentals">
        ← All rentals
      </Link>
      <PageHead
        eyebrow="RENTAL RECORD"
        title={`Rental #${r.number}`}
        description={`${r.customerName} · ${r.vehicleLabel}`}
      >
        <div className="head-actions">
          <Link className="button secondary" to={`/rentals/${id}/receipt`}>
            Print record
          </Link>
          <Link className="button primary" to={`/rentals/${id}/edit`}>
            Edit rental
          </Link>
        </div>
      </PageHead>
      {notice && (
        <div className="success-note" role="status">
          {notice}
        </div>
      )}
      {(error || resource.error) && (
        <ErrorPanel error={error || resource.error} retry={resource.reload} />
      )}
      <div className="detail-grid">
        <section className="panel detail-card">
          <div className="section-head">
            <h2>Reservation</h2>
            <Badge value={r.status} />
          </div>
          <dl className="details">
            <div>
              <dt>Customer</dt>
              <dd>{r.customerName}</dd>
            </div>
            <div>
              <dt>Vehicle</dt>
              <dd>
                {r.vehicleLabel} <span className="muted">· {r.plate}</span>
              </dd>
            </div>
            <div>
              <dt>Pickup date</dt>
              <dd>{r.startDate}</dd>
            </div>
            <div>
              <dt>Return date</dt>
              <dd>{r.endDate}</dd>
            </div>
            <div>
              <dt>Daily rate</dt>
              <dd>{money(r.dailyRateCents, r.currency)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>
                {r.days} day{r.days !== 1 ? "s" : ""}
              </dd>
            </div>
            <div className="total-line">
              <dt>Rental total</dt>
              <dd>{money(r.totalCents, r.currency)}</dd>
            </div>
          </dl>
          {r.notes && (
            <div className="notes">
              <h3>Notes</h3>
              <p>{r.notes}</p>
            </div>
          )}
          <div className="lifecycle">
            <h3>Handover & return</h3>
            {r.status === "reserved" ? (
              <>
                <p className="muted">
                  Full payment is required before handing over the vehicle.
                  Pickup is available during the booked date range.
                </p>
                <div className="head-actions">
                  <button
                    className="primary"
                    disabled={
                      payment?.status !== "paid" ||
                      busy ||
                      vehicles.loading ||
                      !!vehicles.error
                    }
                    onClick={() => setAction("pickup")}
                  >
                    Confirm pickup
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => setAction("cancel")}
                  >
                    Cancel rental
                  </button>
                </div>
              </>
            ) : r.status === "active" ? (
              <>
                <p>
                  Picked up with{" "}
                  <strong>{r.pickupOdometer?.toLocaleString()}</strong> on the
                  odometer.
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => setAction("return")}
                >
                  Complete return
                </button>
              </>
            ) : r.status === "completed" ? (
              <p className="muted">
                Returned with {r.returnOdometer?.toLocaleString()} on the
                odometer. This rental is complete.
              </p>
            ) : (
              <p className="muted">
                The reservation is cancelled and its dates are released.
              </p>
            )}
            {vehicles.error && (
              <ErrorPanel error={vehicles.error} retry={vehicles.reload} />
            )}
          </div>
        </section>
        <section className="panel detail-card payment-card">
          <div className="section-head">
            <h2>Payment</h2>
            <Badge
              value={
                payment?.status === "paid"
                  ? "paid"
                  : payment?.status || "unpaid"
              }
            />
          </div>
          <p className="payment-total">{money(r.totalCents, r.currency)}</p>
          <p className="muted">
            {r.paymentMethod === "cash"
              ? "Cash at the desk"
              : r.paymentMethod === "stripe"
                ? "Stripe checkout link"
                : "PayPal checkout link"}
          </p>
          {payment?.mode === "demo" && (
            <div className="demo-note">Demo payment · no real charge.</div>
          )}
          {payment?.mode === "sandbox" && (
            <div className="demo-note">Sandbox payment · test funds only.</div>
          )}
          {r.status === "cancelled" && payment?.status === "paid" && (
            <div className="notice">
              Payment remains recorded. Review a refund with your payment
              provider or cash register.
            </div>
          )}
          {r.status === "reserved" && payment?.status !== "paid" && (
            <div className="payment-actions">
              {r.paymentMethod === "cash" ? (
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => setAction("cash")}
                >
                  Record cash payment
                </button>
              ) : (
                <>
                  <button
                    className="primary"
                    disabled={busy || payment?.status === "processing"}
                    onClick={() => paymentAction("link")}
                  >
                    {busy
                      ? "Processing…"
                      : payment?.checkoutUrl
                        ? "Refresh checkout link"
                        : "Create checkout link"}
                  </button>
                  {payment?.checkoutUrl && (
                    <>
                      <a
                        className="button secondary"
                        href={payment.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open checkout ↗
                      </a>
                      <label>
                        Customer payment link
                        <input
                          value={payment.checkoutUrl}
                          readOnly
                          onFocus={(e) => e.target.select()}
                        />
                      </label>
                      <button
                        className="secondary"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              payment.checkoutUrl!,
                            );
                            setNotice("Payment link copied.");
                          } catch {
                            setNotice(
                              "Select the payment link above to copy it.",
                            );
                          }
                        }}
                      >
                        Copy payment link
                      </button>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => paymentAction("verify")}
                      >
                        Verify payment
                      </button>
                      <button
                        className="text-button"
                        disabled={busy || payment.status === "processing"}
                        onClick={() => paymentAction("cancel")}
                      >
                        Cancel unpaid link
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
          {payment?.status === "paid" && (
            <div className="paid-info">
              <strong>Payment received</strong>
              <p className="muted">
                {payment.reference || "Recorded successfully"}
              </p>
            </div>
          )}
          <div className="payment-history">
            <h3>Payment history</h3>
            {r.payments.length ? (
              r.payments.map((p) => (
                <div className="history-item" key={p.id}>
                  <div>
                    <strong>
                      {p.provider[0].toUpperCase() + p.provider.slice(1)}
                    </strong>
                    <span className="cell-sub">
                      {p.mode} · {money(p.amountCents, p.currency)}
                    </span>
                  </div>
                  <Badge value={p.status} />
                </div>
              ))
            ) : (
              <p className="muted">No payments recorded.</p>
            )}
          </div>
          <button
            className="text-button"
            onClick={resource.reload}
            disabled={resource.loading}
          >
            Refresh rental status
          </button>
        </section>
      </div>
      {action && (
        <ActionForm
          action={action}
          rental={r}
          odometer={action === "return" ? r.pickupOdometer || 0 : odometer}
          onClose={() => setAction(null)}
          onSaved={() => {
            setAction(null);
            setNotice(
              action === "cash"
                ? "Cash payment recorded."
                : action === "pickup"
                  ? "Vehicle handed over."
                  : action === "return"
                    ? "Rental completed."
                    : "Rental cancelled.",
            );
            resource.reload();
            vehicles.reload();
          }}
        />
      )}
    </>
  );
}
export function Receipt() {
  const { id } = useParams(),
    resource = useResource<Rental>(`/rentals/${id}`),
    r = resource.data;
  if (!r)
    return resource.error ? (
      <ErrorPanel error={resource.error} retry={resource.reload} />
    ) : (
      <p role="status">Loading record…</p>
    );
  const paid = r.payments.find((p) => p.status === "paid");
  return (
    <div className="receipt-wrap">
      <div className="receipt-controls">
        <Link className="button secondary" to={`/rentals/${id}`}>
          ← Rental
        </Link>
        <button className="primary" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <article className="receipt panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">RENTDESK</p>
            <h1>Rental {paid ? "receipt" : "record"}</h1>
          </div>
          <strong>#{r.number}</strong>
        </div>
        <p>{r.customerName}</p>
        <dl className="details">
          <div>
            <dt>Vehicle</dt>
            <dd>
              {r.vehicleLabel} · {r.plate}
            </dd>
          </div>
          <div>
            <dt>Rental dates</dt>
            <dd>
              {r.startDate} to {r.endDate} (return date exclusive)
            </dd>
          </div>
          <div>
            <dt>Daily rate × days</dt>
            <dd>
              {money(r.dailyRateCents, r.currency)} × {r.days}
            </dd>
          </div>
          <div className="total-line">
            <dt>Total</dt>
            <dd>{money(r.totalCents, r.currency)}</dd>
          </div>
          <div>
            <dt>Rental status</dt>
            <dd>{r.status}</dd>
          </div>
          <div>
            <dt>Payment status</dt>
            <dd>{paid ? "Paid" : "Unpaid"}</dd>
          </div>
          {paid && (
            <>
              <div>
                <dt>Payment method</dt>
                <dd>
                  {paid.provider} · {paid.mode}
                </dd>
              </div>
              <div>
                <dt>Payment reference</dt>
                <dd>{paid.reference || "Cash recorded"}</dd>
              </div>
            </>
          )}
        </dl>
        {paid?.mode === "demo" && (
          <p>
            <strong>DEMO — no real payment received.</strong>
          </p>
        )}
        {paid?.mode === "sandbox" && (
          <p>
            <strong>SANDBOX — test funds only.</strong>
          </p>
        )}
        {r.status === "cancelled" && paid && (
          <p>
            Cancelled rental. Payment remains recorded; any refund must be
            reviewed separately.
          </p>
        )}
        {r.notes && <p>{r.notes}</p>}
        <p className="muted">Thank you for choosing RentDesk.</p>
      </article>
    </div>
  );
}
