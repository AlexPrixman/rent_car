import dotenv from "dotenv";
dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });

export function configuration(env = process.env) {
  const production = env.NODE_ENV === "production";
  const portfolioDemo = env.PORTFOLIO_DEMO === "true";
  if (
    portfolioDemo &&
    (env.PAYMENTS_MODE !== "demo" ||
      env.STRIPE_SECRET_KEY ||
      env.PAYPAL_CLIENT_SECRET)
  )
    throw new Error(
      "Portfolio demo requires simulated payments and no merchant secrets",
    );
  const mode = env.PAYMENTS_MODE || (production ? "sandbox" : "demo");
  const publicUrl = (env.PUBLIC_APP_URL || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  const url = new URL(publicUrl);
  const secret =
    env.SESSION_SECRET || "development-only-change-before-deploying";
  const currency = env.BUSINESS_CURRENCY || "USD";
  if (!["demo", "sandbox", "live"].includes(mode))
    throw new Error("Invalid PAYMENTS_MODE");
  if (!["USD", "EUR", "GBP"].includes(currency))
    throw new Error("BUSINESS_CURRENCY must be USD, EUR, or GBP");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error("PUBLIC_APP_URL must be an HTTP(S) origin");
  if (
    production &&
    ((mode === "demo" && !portfolioDemo) ||
      url.protocol !== "https:" ||
      secret.length < 32 ||
      secret.startsWith("development-only"))
  )
    throw new Error(
      "Production requires HTTPS, a unique 32+ character SESSION_SECRET, and sandbox/live payments",
    );
  if (
    env.STRIPE_SECRET_KEY &&
    !env.STRIPE_SECRET_KEY.startsWith(mode === "live" ? "sk_live_" : "sk_test_")
  )
    throw new Error("Stripe secret key does not match PAYMENTS_MODE");
  return {
    production,
    portfolioDemo,
    mode,
    publicUrl,
    secret,
    currency,
    port: Number(env.PORT || 4000),
    databaseUrl: env.DATABASE_URL || "",
    databasePath: env.DATABASE_PATH || "data/rentdesk.sqlite",
    trustProxy: env.TRUST_PROXY === "true",
    stripeKey: env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
    paypalClientId: env.PAYPAL_CLIENT_ID || "",
    paypalSecret: env.PAYPAL_CLIENT_SECRET || "",
    paypalWebhookId: env.PAYPAL_WEBHOOK_ID || "",
  };
}
