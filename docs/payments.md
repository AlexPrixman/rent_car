# Payment setup

Keep merchant credentials in the server environment or the ignored `.env` file. Never put them in frontend code or commit them to Git.

## Modes

| Mode      | Cash                   | Stripe / PayPal                                       |
| --------- | ---------------------- | ----------------------------------------------------- |
| `demo`    | Real staff bookkeeping | Local simulated checkout, no charge; development only |
| `sandbox` | Real staff bookkeeping | Stripe test mode / PayPal sandbox                     |
| `live`    | Real staff bookkeeping | Real merchant payments; configure explicitly          |

`PUBLIC_APP_URL` must be the exact frontend origin, with no path, query, or trailing slash. It controls checkout return links and same-origin mutation checks. Use HTTPS for deployed provider webhooks. The UI identifies demo/sandbox payments in the rental, checkout, receipt, and dashboard.

## Stripe sandbox

1. Create/select a Stripe sandbox and set `PAYMENTS_MODE=sandbox` and `STRIPE_SECRET_KEY=sk_test_…` on the server.
2. Register `https://YOUR_APP/api/payments/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.expired`.
3. Set the endpoint’s `STRIPE_WEBHOOK_SECRET=whsec_…`. Restart the server.
4. Create a Stripe rental, generate its checkout link, and pay using Stripe’s documented sandbox payment details.
5. Confirm the rental becomes paid, the webhook appears successfully delivered in Stripe, and refreshing/retrying does not create another payment.

For local tests, use Stripe’s supported webhook forwarding to `/api/payments/webhooks/stripe`, with that forwarding session’s signing secret. The raw webhook body is preserved for signature verification. Redirect reconciliation retrieves the saved session and validates the amount, currency, client reference, metadata, and test/live mode. Card checkout and adaptive-pricing-disabled amounts keep the rental total fixed.

Official references: [Checkout Session creation](https://docs.stripe.com/api/checkout/sessions/create), [webhooks](https://docs.stripe.com/webhooks), [testing](https://docs.stripe.com/testing).

## PayPal sandbox

1. Create a sandbox REST app and sandbox merchant/buyer accounts in PayPal’s developer dashboard.
2. Set `PAYMENTS_MODE=sandbox`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET` on the server.
3. Register `https://YOUR_APP/api/payments/webhooks/paypal` for `PAYMENT.CAPTURE.COMPLETED`; set the registered `PAYPAL_WEBHOOK_ID` and restart.
4. Create a PayPal rental, generate the link, approve with the sandbox buyer, and return to the app. The server retrieves the order before capturing; the “Finish approved PayPal payment” button safely retries if the return was interrupted.
5. Confirm completed capture and webhook delivery in PayPal, paid status in RentDesk, and no duplicate capture after retries.

Approval alone is not payment. The order must be captured. Stable `PayPal-Request-Id` values protect retries, and completed captures are checked against order ID, `custom_id`, currency, and exact amount. Signed webhooks are verified with PayPal’s verification endpoint and the order is retrieved again before recording payment. A synthetic webhook simulator event is not a substitute for a real sandbox order/capture test.

Official references: [Orders integration](https://developer.paypal.com/api/rest/integration/orders-api), [order request fields](https://developer.paypal.com/sdk/orders/v2/definitions/order_request), [webhook verification](https://developer.paypal.com/api/rest/webhooks/).

## Failure recovery and cancellation

- If checkout creation times out, click “Create checkout link” again. The saved payment ID and provider idempotency key are reused. A creating payment locks cancellation until creation is resolved.
- An uncertain PayPal capture stays `processing`; click “Verify payment” at the rental desk or “Finish approved PayPal payment” on the checkout page to retrieve/retry it safely. Do not manually mark an uncertain provider payment as cash.
- Cancelling an unpaid Stripe link expires its provider session first. If it completed meanwhile, the app records the payment and asks staff to review the rental. PayPal links are stopped by refusing capture after cancellation.
- Payment verification may arrive after rental cancellation. A legitimate captured payment remains recorded, and the rental shows a refund-review message.
- Cancelling a paid rental never erases payment history or automatically refunds it. Staff handle refunds separately with the provider/cash register. Refund reconciliation and chargeback handling are outside this release.

For live operation, set `PAYMENTS_MODE=live`, live provider credentials and webhook configuration, and complete the sandbox checks first. Live Stripe keys must start with `sk_live_`. PayPal automatically switches from `api-m.sandbox.paypal.com` to `api-m.paypal.com`.
