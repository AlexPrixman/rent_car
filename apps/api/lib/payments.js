import { atomic } from "./db.js";
import { publicPayment } from "./domain.js";
import { fail, text, HttpError } from "./validation.js";
import { providerError } from "./gateways.js";

export class Payments {
  constructor(service, gateways) {
    this.s = service;
    this.g = gateways;
    this.jobs = new Map();
  }
  async lock(id, kind, job) {
    const existing = this.jobs.get(id);
    if (existing) {
      if (existing.kind !== kind)
        fail(
          409,
          "A different payment operation is in progress; retry after verification",
        );
      return existing.promise;
    }
    const promise = Promise.resolve().then(job);
    this.jobs.set(id, { kind, promise });
    try {
      return await promise;
    } finally {
      this.jobs.delete(id);
    }
  }
  async link(id, actor) {
    const r = this.s.required("rentals", id);
    if (!this.g.enabled(r.payment_method))
      fail(503, "Payment provider is not configured; add merchant credentials");
    const p = this.s.allocatePayment(id, actor);
    return this.lock(p.id, "create", async () => {
      const current = this.s.required("payments", p.id);
      if (current.status === "pending") return publicPayment(current);
      if (current.status !== "creating")
        fail(409, "This payment cannot create another checkout link");
      try {
        const result = await this.g.create(current, r);
        this.s.run(
          "UPDATE payments SET status='pending',external_id=?,checkout_url=?,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='creating'",
          result.externalId,
          result.url,
          p.id,
        );
        return publicPayment(this.s.required("payments", p.id));
      } catch (error) {
        const status =
          error.statusCode || (error instanceof HttpError ? error.status : 0);
        const definitive =
          status >= 400 && status < 500 && ![409, 429].includes(status);
        this.s.run(
          "UPDATE payments SET status=?,last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
          definitive ? "failed" : "creating",
          definitive
            ? "Provider rejected checkout creation"
            : "Creation uncertain; retry with the same idempotency key",
          p.id,
        );
        if (definitive)
          fail(
            400,
            "Provider rejected checkout creation. Check the rental amount and merchant configuration, then retry",
          );
        throw providerError(error);
      }
    });
  }
  byToken(token) {
    if (!/^[a-f0-9]{64}$/.test(token)) fail(404, "Checkout not found");
    const p = this.s.get("SELECT * FROM payments WHERE public_token=?", token);
    if (!p) fail(404, "Checkout not found");
    return p;
  }
  summary(token) {
    const p = this.byToken(token),
      r = this.s.required("rentals", p.rental_id);
    return {
      number: r.number,
      vehicleLabel: r.vehicle_label,
      startDate: r.start_date,
      endDate: r.end_date,
      rentalStatus: r.status,
      payment: publicPayment(p),
      demo: p.mode === "demo",
    };
  }
  async reconcile(p) {
    if (p.status === "paid") return;
    if (!p.external_id)
      fail(
        409,
        "Checkout link has not been created yet; retry from the rental",
      );
    try {
      const verified = await this.g.reconcile(p);
      if (verified) this.s.settle(p, verified);
    } catch (error) {
      throw providerError(error);
    }
  }
  async capture(p) {
    return this.lock(p.id, "capture", async () => {
      const current = atomic(this.s.db, () => {
        const value = this.s.required("payments", p.id);
        if (value.status === "paid") return value;
        const r = this.s.required("rentals", value.rental_id);
        if (
          value.provider !== "paypal" ||
          !["pending", "processing"].includes(value.status) ||
          r.status === "cancelled"
        )
          fail(409, "This payment cannot be captured");
        this.s.run(
          "UPDATE payments SET status='processing',updated_at=CURRENT_TIMESTAMP WHERE id=?",
          value.id,
        );
        return value;
      });
      if (current.status === "paid") return;
      try {
        this.s.settle(current, await this.g.capture(current));
      } catch (error) {
        // Keep an uncertain capture locked; a retry retrieves the order before capturing again.
        this.s.run(
          "UPDATE payments SET last_error=? WHERE id=?",
          "Capture requires verification; retry safely",
          p.id,
        );
        throw providerError(error);
      }
    });
  }
  async cancelLink(id, actor) {
    const p = this.s.currentPayment(id);
    if (!p) return this.s.rental(id);
    return this.lock(p.id, "cancel", async () => {
      const current = this.s.required("payments", p.id);
      if (["creating", "processing"].includes(current.status))
        fail(
          409,
          "Payment is being processed; retry its creation or verification first",
        );
      if (current.status === "paid")
        fail(
          409,
          "A paid payment cannot be cancelled. Handle refunds in the merchant dashboard",
        );
      try {
        const verified = await this.g.expire(current);
        if (verified) {
          this.s.settle(current, verified);
          fail(
            409,
            "Payment already completed; verify the rental before cancellation",
          );
        }
      } catch (error) {
        throw providerError(error);
      }
      atomic(this.s.db, () => {
        if (this.s.required("payments", p.id).status === "paid")
          fail(409, "Payment already completed");
        this.s.run(
          "UPDATE payments SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?",
          p.id,
        );
        this.s.audit(actor, "payment.link_cancelled", p.id);
      });
      return this.s.rental(id);
    });
  }
  demo(token) {
    if (this.s.config.mode !== "demo") fail(404, "Demo checkout is disabled");
    const p = this.byToken(token),
      r = this.s.required("rentals", p.rental_id);
    if (
      p.mode !== "demo" ||
      r.status !== "reserved" ||
      !["pending", "paid"].includes(p.status)
    )
      fail(409, "This demo checkout is no longer available");
    this.s.settle(p, {
      externalId: p.external_id,
      amountCents: p.amount_cents,
      currency: p.currency,
      mode: "demo",
      reference: `DEMO-${p.id.slice(0, 8)}`,
    });
    return this.summary(token);
  }
  async stripeWebhook(body, signature) {
    const event = this.g.stripeWebhook(body, signature),
      data = event.data?.object;
    if (!event.id || !data) fail(400, "Invalid Stripe event");
    const p = this.s.get(
      "SELECT * FROM payments WHERE provider='stripe' AND external_id=?",
      data.id || "",
    );
    if (!p) return;
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type)
    ) {
      const verified = this.g.stripeResult(data, p);
      if (verified) this.s.settle(p, verified, event.id);
    } else if (event.type === "checkout.session.expired") {
      atomic(this.s.db, () => {
        if (
          !this.s.get(
            "SELECT 1 FROM webhook_events WHERE provider=? AND event_id=?",
            "stripe",
            event.id,
          )
        ) {
          this.s.run(
            "UPDATE payments SET status='failed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'",
            p.id,
          );
          this.s.run(
            "INSERT INTO webhook_events(provider,event_id) VALUES (?,?)",
            "stripe",
            event.id,
          );
        }
      });
    }
  }
  async paypalWebhook(headers, body) {
    const event = await this.g.paypalWebhook(headers, body);
    text(event.id, "Event ID");
    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return;
    const capture = event.resource;
    const orderId = capture?.supplementary_data?.related_ids?.order_id;
    const p = this.s.get(
      "SELECT * FROM payments WHERE provider='paypal' AND external_id=?",
      orderId || "",
    );
    if (!p) return;
    // Retrieve the order as well as verifying the webhook signature, including custom_id and amounts.
    const verified = await this.g.reconcile(p);
    if (
      !verified ||
      capture.status !== "COMPLETED" ||
      verified.reference !== capture.id ||
      capture.amount?.value !== (p.amount_cents / 100).toFixed(2) ||
      capture.amount?.currency_code !== p.currency
    )
      fail(400, "PayPal event does not match the completed order");
    this.s.settle(p, verified, event.id);
  }
}
