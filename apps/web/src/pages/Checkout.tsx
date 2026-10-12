import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { money, send, useResource } from "../api";
import { Badge, ErrorPanel, Icon } from "../components";
import type { CheckoutData } from "../types";
export default function Checkout() {
  const { token } = useParams(),
    [params] = useSearchParams(),
    resource = useResource<CheckoutData>(`/checkout/${token}`),
    data = resource.data;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    handled = useRef(false);
  async function check(action: string) {
    setBusy(true);
    setError("");
    try {
      await send(`/checkout/${token}/${action}`, {
        sessionId: params.get("session_id") || undefined,
        orderId: params.get("token") || undefined,
      });
      resource.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (data && !handled.current) {
      handled.current = true;
      if (
        params.get("result") === "success" &&
        !data.demo &&
        data.payment.status !== "paid"
      )
        void check(
          data.payment.provider === "paypal" ? "capture" : "reconcile",
        );
    }
  }, [data?.payment.id]);
  const paid = data?.payment.status === "paid",
    available =
      data &&
      ["pending", "processing"].includes(data.payment.status) &&
      data.rentalStatus !== "cancelled";
  return (
    <main className="checkout-page">
      <Link className="brand checkout-brand" to="/login">
        <span className="brand-symbol">
          <Icon />
        </span>
        rentdesk<span className="brand-dot">.</span>
      </Link>
      <section className="checkout-card panel">
        {data ? (
          <>
            <p className="eyebrow">RENTAL #{data.number}</p>
            <h1>
              {paid
                ? "Payment received"
                : data.rentalStatus === "cancelled"
                  ? "Rental cancelled"
                  : "Your rental payment"}
            </h1>
            <p className="muted">
              {data.vehicleLabel} · {data.startDate} to {data.endDate}
            </p>
            <p className="checkout-amount">
              {money(data.payment.amountCents, data.payment.currency)}
            </p>
            <Badge value={data.payment.status} />
            {(error || resource.error) && (
              <ErrorPanel
                error={error || resource.error}
                retry={resource.reload}
              />
            )}{" "}
            {data.demo && (
              <div className="demo-note">
                <strong>
                  Demo checkout ·{" "}
                  {data.payment.provider === "stripe" ? "Stripe" : "PayPal"}{" "}
                  simulation
                </strong>
                <p>
                  No card or PayPal account is needed. This simulates payment
                  for testing and does not charge real money.
                </p>
              </div>
            )}
            {data.payment.mode === "sandbox" && (
              <div className="demo-note">
                Sandbox checkout. Use your provider’s test account or test
                payment details.
              </div>
            )}
            {paid ? (
              <p className="paid-confirmation" role="status">
                {data.demo
                  ? "Demo payment completed."
                  : "Your payment has been verified."}{" "}
                You can close this page and contact the rental desk for pickup.
              </p>
            ) : available ? (
              <div className="payment-actions">
                {data.demo ? (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => check("demo")}
                  >
                    {busy ? "Processing…" : "Complete demo payment"}
                  </button>
                ) : (
                  <>
                    <a
                      className="button primary"
                      href={data.payment.checkoutUrl || "#"}
                    >
                      Continue to{" "}
                      {data.payment.provider === "stripe" ? "Stripe" : "PayPal"}{" "}
                      ↗
                    </a>
                    {data.payment.provider === "paypal" && (
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => check("capture")}
                      >
                        Finish approved PayPal payment
                      </button>
                    )}
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => check("reconcile")}
                    >
                      {busy ? "Verifying…" : "Check payment status"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="muted">
                This checkout link is no longer available. Contact the rental
                desk for help.
              </p>
            )}
            {params.get("result") === "cancel" && !paid && (
              <p className="muted">
                Checkout was interrupted. No payment is marked received. You can
                continue above.
              </p>
            )}
            {data.rentalStatus === "cancelled" && paid && (
              <div className="notice">
                The rental is cancelled. Contact the rental desk to review any
                refund.
              </div>
            )}
          </>
        ) : resource.error ? (
          <>
            <h1>Checkout unavailable</h1>
            <ErrorPanel error={resource.error} retry={resource.reload} />
          </>
        ) : (
          <p role="status">Loading secure checkout…</p>
        )}
      </section>
      <p className="checkout-foot">
        Payment status is verified by the rental system.
      </p>
    </main>
  );
}
