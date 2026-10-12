import Stripe from "stripe";
import { HttpError, fail } from "./validation.js";

function paypalError(status, message) {
  const error = new HttpError(status === 422 ? 409 : 502, message);
  error.statusCode = status;
  throw error;
}

export function approvedCheckoutUrl(url, provider, mode) {
  const parsed = new URL(url);
  const allowed =
    provider === "stripe"
      ? ["checkout.stripe.com"]
      : mode === "live"
        ? ["www.paypal.com"]
        : ["www.sandbox.paypal.com"];
  if (
    parsed.protocol !== "https:" ||
    !allowed.includes(parsed.hostname) ||
    parsed.username ||
    parsed.password
  )
    fail(502, "Provider returned an invalid checkout URL");
  return url;
}
export function paypalCapture(order, payment, mode) {
  const units = order.purchase_units || [];
  const captures = units.flatMap((unit) => unit.payments?.captures || []);
  if (
    order.id !== payment.external_id ||
    order.status !== "COMPLETED" ||
    units.length !== 1 ||
    units[0].custom_id !== payment.id ||
    captures.length !== 1 ||
    captures[0].status !== "COMPLETED"
  )
    fail(409, "PayPal has not completed this payment");
  const amount = captures[0].amount;
  if (!amount || !/^\d+\.\d{2}$/.test(amount.value))
    fail(400, "Invalid PayPal amount");
  return {
    externalId: order.id,
    amountCents: Number(amount.value.replace(".", "")),
    currency: amount.currency_code,
    mode,
    reference: captures[0].id,
  };
}

export class PayPalClient {
  constructor(config, fetcher = fetch) {
    this.config = config;
    this.fetcher = fetcher;
    this.base =
      config.mode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
    this.token = null;
    this.tokenPromise = null;
  }
  async accessToken() {
    if (this.token && this.token.expires > Date.now()) return this.token.value;
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = (async () => {
      const response = await this.fetcher(`${this.base}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.paypalClientId}:${this.config.paypalSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        paypalError(
          response.status,
          "PayPal authentication failed; check merchant configuration",
        );
      const body = await response.json();
      if (!body.access_token || !Number.isFinite(body.expires_in))
        fail(502, "Invalid PayPal authentication response");
      this.token = {
        value: body.access_token,
        expires: Date.now() + Math.max(0, body.expires_in - 30) * 1000,
      };
      return body.access_token;
    })();
    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  }
  async request(
    path,
    { method = "GET", body, idempotency } = {},
    retry = true,
  ) {
    const token = await this.accessToken();
    const response = await this.fetcher(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(idempotency ? { "PayPal-Request-Id": idempotency } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 401 && retry) {
      this.token = null;
      return this.request(path, { method, body, idempotency }, false);
    }
    if (!response.ok)
      paypalError(
        response.status,
        "PayPal could not process this request; retry or check the merchant dashboard",
      );
    return response.json();
  }
}

export function createGateways(config, { stripeClient, fetcher } = {}) {
  const stripe =
    stripeClient ||
    (config.stripeKey
      ? new Stripe(config.stripeKey, { timeout: 15000, maxNetworkRetries: 2 })
      : null);
  const paypal = new PayPalClient(config, fetcher);
  const returnUrl = (p) => `${config.publicUrl}/checkout/${p.public_token}`;
  const enabled = (provider) =>
    config.mode === "demo" ||
    (provider === "stripe"
      ? Boolean(stripe)
      : Boolean(config.paypalClientId && config.paypalSecret));
  const requireProvider = (provider) => {
    if (!enabled(provider))
      fail(
        503,
        `${provider === "stripe" ? "Stripe" : "PayPal"} is not configured. Add merchant credentials to the server environment`,
      );
  };
  return {
    enabled,
    async create(payment, rental) {
      requireProvider(payment.provider);
      if (config.mode === "demo")
        return { externalId: `demo_${payment.id}`, url: returnUrl(payment) };
      if (payment.provider === "stripe") {
        const result = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            allowed_payment_method_types: ["card"],
            adaptive_pricing: { enabled: false },
            client_reference_id: payment.id,
            metadata: { paymentId: payment.id, rentalId: rental.id },
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: payment.currency.toLowerCase(),
                  unit_amount: payment.amount_cents,
                  product_data: {
                    name: `RentDesk rental #${rental.number}`,
                    description: `${rental.vehicle_label} · ${rental.start_date} to ${rental.end_date}`,
                  },
                },
              },
            ],
            success_url: `${returnUrl(payment)}?result=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl(payment)}?result=cancel`,
          },
          { idempotencyKey: payment.id },
        );
        if (!result.id || !result.url)
          fail(502, "Stripe did not return a checkout session");
        return {
          externalId: result.id,
          url: approvedCheckoutUrl(result.url, "stripe", config.mode),
        };
      }
      const result = await paypal.request("/v2/checkout/orders", {
        method: "POST",
        idempotency: payment.id,
        body: {
          intent: "CAPTURE",
          purchase_units: [
            {
              custom_id: payment.id,
              description: `RentDesk rental #${rental.number}`,
              amount: {
                currency_code: payment.currency,
                value: (payment.amount_cents / 100).toFixed(2),
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: "RentDesk",
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
                return_url: `${returnUrl(payment)}?result=success`,
                cancel_url: `${returnUrl(payment)}?result=cancel`,
              },
            },
          },
        },
      });
      const link = result.links?.find((l) =>
        ["payer-action", "approve"].includes(l.rel),
      )?.href;
      if (!result.id || !link)
        fail(502, "PayPal did not return an approval link");
      return {
        externalId: result.id,
        url: approvedCheckoutUrl(link, "paypal", config.mode),
      };
    },
    async reconcile(payment) {
      if (config.mode === "demo") return null;
      requireProvider(payment.provider);
      if (payment.provider === "paypal") {
        const order = await paypal.request(
          `/v2/checkout/orders/${encodeURIComponent(payment.external_id)}`,
        );
        return order.status === "COMPLETED"
          ? paypalCapture(order, payment, config.mode)
          : null;
      }
      const result = await stripe.checkout.sessions.retrieve(
        payment.external_id,
      );
      return this.stripeResult(result, payment);
    },
    stripeResult(result, payment) {
      if (result.payment_status !== "paid") return null;
      if (
        result.metadata?.paymentId !== payment.id ||
        result.client_reference_id !== payment.id
      )
        fail(400, "Stripe payment metadata does not match");
      return {
        externalId: result.id,
        amountCents: result.amount_total,
        currency: result.currency?.toUpperCase(),
        mode: result.livemode ? "live" : "sandbox",
        reference:
          typeof result.payment_intent === "string"
            ? result.payment_intent
            : result.id,
      };
    },
    async capture(payment) {
      requireProvider("paypal");
      if (config.mode === "demo")
        fail(409, "Use the explicitly labelled demo checkout");
      let order = await paypal.request(
        `/v2/checkout/orders/${encodeURIComponent(payment.external_id)}`,
      );
      if (order.status === "APPROVED") {
        await paypal.request(
          `/v2/checkout/orders/${encodeURIComponent(payment.external_id)}/capture`,
          { method: "POST", body: {}, idempotency: `${payment.id}:capture` },
        );
        // Capture responses can omit purchase-unit metadata. Retrieve the full
        // order before checking custom_id, captured amount, and currency.
        order = await paypal.request(
          `/v2/checkout/orders/${encodeURIComponent(payment.external_id)}`,
        );
      }
      return paypalCapture(order, payment, config.mode);
    },
    async expire(payment) {
      if (config.mode === "demo" || payment.provider === "paypal") return null;
      const result = await stripe.checkout.sessions.retrieve(
        payment.external_id,
      );
      const verified = this.stripeResult(result, payment);
      if (verified) return verified;
      if (result.status === "open")
        await stripe.checkout.sessions.expire(payment.external_id);
      return null;
    },
    stripeWebhook(body, signature) {
      if (config.mode === "demo" || !stripe || !config.stripeWebhookSecret)
        fail(503, "Stripe webhook is not configured");
      try {
        return stripe.webhooks.constructEvent(
          body,
          signature,
          config.stripeWebhookSecret,
        );
      } catch {
        fail(400, "Invalid Stripe webhook signature");
      }
    },
    async paypalWebhook(headers, event) {
      if (
        config.mode === "demo" ||
        !config.paypalWebhookId ||
        !enabled("paypal")
      )
        fail(503, "PayPal webhook is not configured");
      const fields = [
        "paypal-auth-algo",
        "paypal-cert-url",
        "paypal-transmission-id",
        "paypal-transmission-sig",
        "paypal-transmission-time",
      ];
      if (fields.some((f) => typeof headers[f] !== "string" || !headers[f]))
        fail(400, "Missing PayPal signature headers");
      const result = await paypal.request(
        "/v1/notifications/verify-webhook-signature",
        {
          method: "POST",
          body: {
            auth_algo: headers["paypal-auth-algo"],
            cert_url: headers["paypal-cert-url"],
            transmission_id: headers["paypal-transmission-id"],
            transmission_sig: headers["paypal-transmission-sig"],
            transmission_time: headers["paypal-transmission-time"],
            webhook_id: config.paypalWebhookId,
            webhook_event: event,
          },
        },
      );
      if (result.verification_status !== "SUCCESS")
        fail(400, "Invalid PayPal webhook signature");
      return event;
    },
  };
}

export function providerError(error) {
  if (error instanceof HttpError) return error;
  return new HttpError(
    502,
    "Payment provider is temporarily unavailable. Retry the same request; payment status will be verified safely",
  );
}
