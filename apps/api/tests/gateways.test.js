import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import {
  createGateways,
  PayPalClient,
  approvedCheckoutUrl,
} from "../lib/gateways.js";
import { fixture, rental } from "./helpers.js";
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
const stripeConfig = {
  mode: "sandbox",
  stripeKey: "sk_test_contract",
  stripeWebhookSecret: "whsec_contract",
  publicUrl: "http://localhost:5173",
};
function stripeHarness() {
  const calls = [];
  let current;
  const client = new Stripe("sk_test_contract", {
    maxNetworkRetries: 0,
    httpClient: Stripe.createFetchHttpClient(async (url, init) => {
      calls.push({
        url: String(url),
        method: init.method,
        body: init.body,
        headers: init.headers,
      });
      if (init.method === "POST" && !String(url).endsWith("/expire"))
        return json({
          id: "cs_test_contract",
          url: "https://checkout.stripe.com/c/pay/cs_test_contract",
        });
      if (String(url).endsWith("/expire"))
        return json({
          ...current,
          status: "expired",
        });
      return json(current);
    }),
  });
  return {
    client,
    calls,
    set: (session) => {
      current = session;
    },
  };
}
function paidSession(p, patch = {}) {
  return {
    id: p.external_id,
    object: "checkout.session",
    status: "complete",
    payment_status: "paid",
    amount_total: p.amount_cents,
    currency: p.currency.toLowerCase(),
    livemode: false,
    client_reference_id: p.id,
    metadata: {
      paymentId: p.id,
      rentalId: p.rental_id,
    },
    payment_intent: "pi_contract",
    ...patch,
  };
}
test("Stripe SDK contract sends exact amount, metadata, URLs, and stable idempotency", async (t) => {
  const h = stripeHarness(),
    g = createGateways(stripeConfig, {
      stripeClient: h.client,
    }),
    f = await fixture(t, stripeConfig, {
      gateways: g,
    }),
    r = await rental(f, "stripe");
  const link = (
    await f.employee
      .post(`/api/rentals/${r.id}/payments/link`)
      .send({})
      .expect(200)
  ).body;
  const p = await f.service.required("payments", link.id),
    body = new URLSearchParams(h.calls[0].body);
  assert.equal(body.get("mode"), "payment");
  assert.equal(
    body.get("line_items[0][price_data][unit_amount]"),
    String(r.totalCents),
  );
  assert.equal(body.get("line_items[0][price_data][currency]"), "usd");
  assert.equal(body.get("metadata[paymentId]"), p.id);
  assert.equal(body.get("adaptive_pricing[enabled]"), "false");
  assert.equal(body.get("allowed_payment_method_types[0]"), "card");
  assert.ok(body.get("success_url").includes(p.public_token));
  const headers = new Headers(h.calls[0].headers);
  assert.equal(headers.get("Idempotency-Key"), p.id);
  await f.employee
    .post(`/api/rentals/${r.id}/payments/link`)
    .send({})
    .expect(200);
  assert.equal(h.calls.length, 1);
});
test("Stripe webhooks require valid fresh signatures, full matching amounts, and paid state", async (t) => {
  const h = stripeHarness(),
    g = createGateways(stripeConfig, {
      stripeClient: h.client,
    }),
    f = await fixture(t, stripeConfig, {
      gateways: g,
    }),
    r = await rental(f, "stripe");
  const link = (
      await f.employee.post(`/api/rentals/${r.id}/payments/link`).send({})
    ).body,
    p = await f.service.required("payments", link.id);
  const emit = async (
    session,
    { id = "evt_contract", signature, timestamp } = {},
  ) => {
    const payload = JSON.stringify({
      id,
      type: "checkout.session.completed",
      data: {
        object: session,
      },
    });
    const header =
      signature ||
      h.client.webhooks.generateTestHeaderString({
        payload,
        secret: "whsec_contract",
        ...(timestamp
          ? {
              timestamp,
            }
          : {}),
      });
    return f.request
      .post("/api/payments/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", header)
      .send(payload);
  };
  assert.equal(
    (
      await emit(paidSession(p), {
        signature: "invalid",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await emit(paidSession(p), {
        timestamp: Math.floor(Date.now() / 1000) - 600,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await emit(
        paidSession(p, {
          amount_total: 1,
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await emit(
        paidSession(p, {
          livemode: true,
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await emit(
        paidSession(p, {
          payment_status: "unpaid",
        }),
        {
          id: "evt_unpaid",
        },
      )
    ).status,
    200,
  );
  assert.equal((await f.service.rental(r.id)).payments[0].status, "pending");
  assert.equal((await emit(paidSession(p))).status, 200);
  assert.equal((await emit(paidSession(p))).status, 200);
  assert.equal((await f.service.rental(r.id)).payments[0].status, "paid");
  assert.equal(
    (
      await f.service.get(
        "SELECT COUNT(*) AS n FROM webhook_events WHERE provider='stripe'",
      )
    ).n,
    1,
  );
  assert.equal(
    (
      await f.service.get(
        "SELECT COUNT(*) AS n FROM audit_log WHERE action='payment.verified'",
      )
    ).n,
    1,
  );
});
test("Stripe reconciliation retrieves the saved session and rejects a forged redirect", async (t) => {
  const h = stripeHarness(),
    g = createGateways(stripeConfig, {
      stripeClient: h.client,
    }),
    f = await fixture(t, stripeConfig, {
      gateways: g,
    }),
    r = await rental(f, "stripe");
  const link = (
      await f.employee.post(`/api/rentals/${r.id}/payments/link`).send({})
    ).body,
    p = await f.service.required("payments", link.id);
  h.set(paidSession(p));
  await f.request
    .post(`/api/checkout/${p.public_token}/reconcile`)
    .send({
      sessionId: "other_session",
    })
    .expect(400);
  await f.request
    .post(`/api/checkout/${p.public_token}/reconcile`)
    .send({
      sessionId: p.external_id,
    })
    .expect(200);
  assert.equal((await f.service.rental(r.id)).payments[0].status, "paid");
});
test("cancelled Stripe link expires at the provider before releasing rental terms", async (t) => {
  const h = stripeHarness(),
    g = createGateways(stripeConfig, {
      stripeClient: h.client,
    }),
    f = await fixture(t, stripeConfig, {
      gateways: g,
    }),
    r = await rental(f, "stripe");
  const link = (
      await f.employee.post(`/api/rentals/${r.id}/payments/link`).send({})
    ).body,
    p = await f.service.required("payments", link.id);
  h.set(
    paidSession(p, {
      status: "open",
      payment_status: "unpaid",
    }),
  );
  await f.employee
    .post(`/api/rentals/${r.id}/payments/cancel`)
    .send({})
    .expect(200);
  assert.ok(h.calls.some((c) => c.url.endsWith("/expire")));
  assert.equal((await f.service.rental(r.id)).payments[0].status, "cancelled");
});
function paypalHarness({
  signature = "SUCCESS",
  wrongAmount = false,
  delayCapture = false,
} = {}) {
  const calls = [];
  let order, release;
  const fetcher = async (url, init) => {
    const path = new URL(url).pathname,
      body = init.body
        ? JSON.parse(init.body.startsWith("{") ? init.body : "{}")
        : undefined;
    calls.push({
      url: String(url),
      path,
      method: init.method,
      body,
      headers: init.headers,
    });
    if (path === "/v1/oauth2/token")
      return json({
        access_token: "contract_token",
        expires_in: 3600,
      });
    if (path === "/v1/notifications/verify-webhook-signature")
      return json({
        verification_status: signature,
      });
    if (path === "/v2/checkout/orders" && init.method === "POST") {
      order = {
        id: "ORDERCONTRACT",
        status: "APPROVED",
        purchase_units: body.purchase_units,
        links: [
          {
            rel: "payer-action",
            href: "https://www.sandbox.paypal.com/checkoutnow?token=ORDERCONTRACT",
          },
        ],
      };
      return json(order);
    }
    if (path.endsWith("/capture")) {
      if (delayCapture)
        await new Promise((resolve) => {
          release = resolve;
        });
      order = {
        ...order,
        status: "COMPLETED",
        purchase_units: order.purchase_units.map((u) => ({
          ...u,
          payments: {
            captures: [
              {
                id: "CAPTURECONTRACT",
                status: "COMPLETED",
                amount: {
                  ...u.amount,
                  value: wrongAmount ? "0.01" : u.amount.value,
                },
              },
            ],
          },
        })),
      };
      return json(order);
    }
    return json(order);
  };
  return {
    fetcher,
    calls,
    release: () => release?.(),
    get hasCapture() {
      return calls.some((c) => c.path.endsWith("/capture"));
    },
  };
}
const paypalConfig = {
  mode: "sandbox",
  publicUrl: "http://localhost:5173",
  paypalClientId: "test_client",
  paypalSecret: "test_secret",
  paypalWebhookId: "WH-CONTRACT",
};
test("PayPal creation rejection releases the unpaid rental for correction", async (t) => {
  const h = paypalHarness();
  const g = createGateways(paypalConfig, {
    fetcher: async (url, init) =>
      new URL(url).pathname === "/v2/checkout/orders" && init.method === "POST"
        ? json(
            {
              name: "UNPROCESSABLE_ENTITY",
            },
            422,
          )
        : h.fetcher(url, init),
  });
  const f = await fixture(t, paypalConfig, {
      gateways: g,
    }),
    r = await rental(f, "paypal");
  await f.employee
    .post(`/api/rentals/${r.id}/payments/link`)
    .send({})
    .expect(400);
  assert.equal((await f.service.rental(r.id)).payments[0].status, "failed");
  await f.employee
    .patch(`/api/rentals/${r.id}`)
    .send({
      ...r,
      paymentMethod: "cash",
    })
    .expect(200);
});
test("PayPal OAuth/create/approve/capture contract uses fixed amount and idempotency", async (t) => {
  const h = paypalHarness(),
    g = createGateways(paypalConfig, {
      fetcher: h.fetcher,
    }),
    f = await fixture(t, paypalConfig, {
      gateways: g,
    }),
    r = await rental(f, "paypal");
  const link = (
      await f.employee
        .post(`/api/rentals/${r.id}/payments/link`)
        .send({})
        .expect(200)
    ).body,
    p = await f.service.required("payments", link.id);
  const create = h.calls.find((c) => c.path === "/v2/checkout/orders");
  assert.equal(create.body.intent, "CAPTURE");
  assert.equal(create.body.purchase_units[0].amount.value, "90.00");
  assert.equal(create.body.purchase_units[0].custom_id, p.id);
  assert.equal(
    create.body.payment_source.paypal.experience_context.shipping_preference,
    "NO_SHIPPING",
  );
  assert.equal(create.headers["PayPal-Request-Id"], p.id);
  await f.request
    .post(`/api/checkout/${p.public_token}/capture`)
    .send({
      orderId: "FORGED",
    })
    .expect(400);
  const captures = await Promise.all([
    f.request.post(`/api/checkout/${p.public_token}/capture`).send({
      orderId: p.external_id,
    }),
    f.request.post(`/api/checkout/${p.public_token}/capture`).send({}),
  ]);
  assert.ok(captures.every((c) => c.status === 200));
  assert.equal(h.calls.filter((c) => c.path.endsWith("/capture")).length, 1);
  assert.equal(
    h.calls.find((c) => c.path.endsWith("/capture")).headers[
      "PayPal-Request-Id"
    ],
    `${p.id}:capture`,
  );
  assert.equal((await f.service.rental(r.id)).payments[0].status, "paid");
});
test("PayPal completed webhook requires successful provider signature verification", async (t) => {
  const h = paypalHarness(),
    g = createGateways(paypalConfig, {
      fetcher: h.fetcher,
    }),
    f = await fixture(t, paypalConfig, {
      gateways: g,
    }),
    r = await rental(f, "paypal");
  const link = (
      await f.employee.post(`/api/rentals/${r.id}/payments/link`).send({})
    ).body,
    p = await f.service.required("payments", link.id);
  await f.request
    .post(`/api/checkout/${p.public_token}/capture`)
    .send({})
    .expect(200);
  const event = {
    id: "WH-EVENT",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAPTURECONTRACT",
      status: "COMPLETED",
      amount: {
        value: "90.00",
        currency_code: "USD",
      },
      supplementary_data: {
        related_ids: {
          order_id: p.external_id,
        },
      },
    },
  };
  await f.request.post("/api/payments/webhooks/paypal").send(event).expect(400);
  const headers = {
    "paypal-auth-algo": "SHA256withRSA",
    "paypal-cert-url": "https://api.paypal.com/cert",
    "paypal-transmission-id": "test-transmission",
    "paypal-transmission-sig": "provider-verifies-this",
    "paypal-transmission-time": new Date().toISOString(),
  };
  for (let i = 0; i < 2; i++)
    await f.request
      .post("/api/payments/webhooks/paypal")
      .set(headers)
      .send(event)
      .expect(200);
  const verification = h.calls.find((c) => c.path.includes("verify-webhook"));
  assert.equal(verification.body.webhook_id, "WH-CONTRACT");
  assert.equal(verification.body.webhook_event.id, event.id);
  assert.equal(
    (
      await f.service.get(
        "SELECT COUNT(*) AS n FROM webhook_events WHERE provider='paypal'",
      )
    ).n,
    1,
  );
});
test("PayPal rejects incorrect captured amount and locks an uncertain capture for verification", async (t) => {
  const h = paypalHarness({
      wrongAmount: true,
    }),
    g = createGateways(paypalConfig, {
      fetcher: h.fetcher,
    }),
    f = await fixture(t, paypalConfig, {
      gateways: g,
    }),
    r = await rental(f, "paypal");
  const link = (
      await f.employee.post(`/api/rentals/${r.id}/payments/link`).send({})
    ).body,
    p = await f.service.required("payments", link.id);
  await f.request
    .post(`/api/checkout/${p.public_token}/capture`)
    .send({})
    .expect(400);
  assert.equal((await f.service.rental(r.id)).payments[0].status, "processing");
  await f.employee.post(`/api/rentals/${r.id}/cancel`).send({}).expect(409);
});
test("cancellation cannot race an in-flight PayPal capture", async (t) => {
  const h = paypalHarness({
      delayCapture: true,
    }),
    g = createGateways(paypalConfig, {
      fetcher: h.fetcher,
    }),
    f = await fixture(t, paypalConfig, {
      gateways: g,
    }),
    r = await rental(f, "paypal");
  const link = (
      await f.employee.post(`/api/rentals/${r.id}/payments/link`).send({})
    ).body,
    p = await f.service.required("payments", link.id);
  const capturing = f.request
    .post(`/api/checkout/${p.public_token}/capture`)
    .send({})
    .then((response) => response);
  for (let i = 0; i < 100 && !h.hasCapture; i++)
    await new Promise((resolve) => setTimeout(resolve, 5));
  assert.ok(h.hasCapture);
  await f.employee.post(`/api/rentals/${r.id}/cancel`).send({}).expect(409);
  h.release();
  assert.equal((await capturing).status, 200);
});
test("PayPal OAuth caches credentials and refreshes once on 401", async () => {
  let tokens = 0,
    calls = 0;
  const client = new PayPalClient(paypalConfig, async (url) =>
    new URL(url).pathname === "/v1/oauth2/token"
      ? json({
          access_token: `token${++tokens}`,
          expires_in: 3600,
        })
      : ++calls === 1
        ? json({}, 401)
        : json({
            id: "ok",
          }),
  );
  assert.equal((await client.request("/v2/checkout/orders/ID")).id, "ok");
  assert.equal(tokens, 2);
  await client.request("/v2/checkout/orders/ID");
  assert.equal(tokens, 2);
});
test("checkout URLs cannot point to arbitrary hosts or use non-HTTPS protocols", () => {
  assert.equal(
    approvedCheckoutUrl(
      "https://checkout.stripe.com/c/pay/ok",
      "stripe",
      "sandbox",
    ),
    "https://checkout.stripe.com/c/pay/ok",
  );
  for (const url of [
    "javascript:alert(1)",
    "https://checkout.stripe.com.attacker.com/",
    "http://checkout.stripe.com/",
    "https://attacker.com/",
  ])
    assert.throws(() => approvedCheckoutUrl(url, "stripe", "sandbox"));
});
