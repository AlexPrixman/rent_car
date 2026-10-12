import express from "express";
import session from "express-session";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { openDatabase, SqliteSessionStore } from "./lib/db.js";
import { RentalService, publicUser } from "./lib/domain.js";
import { createGateways } from "./lib/gateways.js";
import { Payments } from "./lib/payments.js";
import { fail, text, HttpError } from "./lib/validation.js";

const fallbackHash = bcrypt.hashSync("unused-password-for-timing", 12);
const sessionCall = (sessionValue, method) =>
  new Promise((resolve, reject) =>
    sessionValue[method]((error) => (error ? reject(error) : resolve())),
  );

export function createApp(config, options = {}) {
  const db = options.db || openDatabase(config.databasePath);
  const service = new RentalService(db, config),
    gateways = options.gateways || createGateways(config);
  const payments = new Payments(service, gateways),
    app = express();
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "upgrade-insecure-requests": config.production ? [] : null,
        },
      },
    }),
  );
  app.post(
    "/api/payments/webhooks/stripe",
    express.raw({ type: "application/json", limit: "256kb" }),
    async (req, res) => {
      await payments.stripeWebhook(req.body, req.get("stripe-signature"));
      res.json({ received: true });
    },
  );
  app.use(express.json({ limit: "256kb" }));
  app.use((req, res, next) => {
    if (["POST", "PATCH", "PUT"].includes(req.method)) {
      req.body ??= {};
      if (typeof req.body !== "object" || Array.isArray(req.body))
        return next(new HttpError(400, "Send a JSON object"));
    }
    next();
  });
  app.post("/api/payments/webhooks/paypal", async (req, res) => {
    await payments.paypalWebhook(req.headers, req.body);
    res.json({ received: true });
  });
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      if (origin && origin !== config.publicUrl)
        return next(new HttpError(403, "Request origin is not allowed"));
      if (req.get("sec-fetch-site") === "cross-site")
        return next(new HttpError(403, "Cross-site requests are not allowed"));
    }
    next();
  });
  app.use(
    session({
      name: "rentdesk.sid",
      secret: config.secret,
      store: new SqliteSessionStore(db),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.production,
        maxAge: 8 * 3600 * 1000,
      },
    }),
  );
  app.get("/api/health", (req, res) => {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok" });
  });
  app.get("/api/config", (req, res) =>
    res.json({
      currency: config.currency,
      paymentMode: config.mode,
      providers: {
        cash: true,
        stripe: gateways.enabled("stripe"),
        paypal: gateways.enabled("paypal"),
      },
      demoLogin: !config.production && config.mode === "demo",
    }),
  );
  const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: options.loginLimit || 15,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Try again in 10 minutes" },
  });
  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const username = text(req.body?.username, "Username", { max: 30 });
    const supplied =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (supplied.length > 1000) fail(400, "Invalid password");
    const user = service.get("SELECT * FROM users WHERE username=?", username);
    const match = await bcrypt.compare(
      supplied,
      user?.password_hash || fallbackHash,
    );
    if (!user?.active || !match) fail(401, "Invalid username or password");
    await sessionCall(req.session, "regenerate");
    req.session.userId = user.id;
    req.session.version = user.session_version;
    await sessionCall(req.session, "save");
    res.json(publicUser(user));
  });
  app.post("/api/auth/logout", async (req, res) => {
    await sessionCall(req.session, "destroy");
    res.clearCookie("rentdesk.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: config.production,
    });
    res.status(204).end();
  });
  const requireAuth = (req, res, next) => {
    const user =
      req.session.userId &&
      service.get("SELECT * FROM users WHERE id=?", req.session.userId);
    if (!user?.active || req.session.version !== user.session_version)
      return next(new HttpError(401, "Please sign in to continue"));
    req.user = user;
    next();
  };
  const requireManager = (req, res, next) =>
    req.user.role === "Manager"
      ? next()
      : next(new HttpError(403, "Only managers can manage employees"));
  app.get("/api/auth/me", requireAuth, (req, res) =>
    res.json(publicUser(req.user)),
  );
  const checkoutLimiter = rateLimit({
    windowMs: 60000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many checkout requests; retry shortly" },
  });
  app.use("/api/checkout", checkoutLimiter);
  app.get("/api/checkout/:token", (req, res) =>
    res.json(payments.summary(req.params.token)),
  );
  app.post("/api/checkout/:token/demo", (req, res) =>
    res.json(payments.demo(req.params.token)),
  );
  app.post("/api/checkout/:token/reconcile", async (req, res) => {
    const p = payments.byToken(req.params.token);
    if (req.body?.sessionId && req.body.sessionId !== p.external_id)
      fail(400, "Checkout session does not match");
    await payments.reconcile(p);
    res.json(payments.summary(req.params.token));
  });
  app.post("/api/checkout/:token/capture", async (req, res) => {
    const p = payments.byToken(req.params.token);
    if (req.body?.orderId && req.body.orderId !== p.external_id)
      fail(400, "PayPal order does not match");
    await payments.capture(p);
    res.json(payments.summary(req.params.token));
  });
  app.use("/api", requireAuth);
  app.get("/api/dashboard", (req, res) => res.json(service.dashboard()));
  app.get("/api/employees", requireManager, (req, res) =>
    res.json(service.list("users", req.query)),
  );
  app.post("/api/employees", requireManager, async (req, res) =>
    res.status(201).json(await service.createUser(req.body, req.user.id)),
  );
  app.patch("/api/employees/:id", requireManager, async (req, res) =>
    res.json(await service.updateUser(req.params.id, req.body, req.user.id)),
  );
  app.get("/api/customers", (req, res) =>
    res.json(service.list("customers", req.query)),
  );
  app.post("/api/customers", (req, res) =>
    res.status(201).json(service.createCustomer(req.body, req.user.id)),
  );
  app.patch("/api/customers/:id", (req, res) =>
    res.json(service.updateCustomer(req.params.id, req.body, req.user.id)),
  );
  app.get("/api/vehicles", (req, res) =>
    res.json(service.list("vehicles", req.query)),
  );
  app.post("/api/vehicles", (req, res) =>
    res.status(201).json(service.createVehicle(req.body, req.user.id)),
  );
  app.patch("/api/vehicles/:id", (req, res) =>
    res.json(service.updateVehicle(req.params.id, req.body, req.user.id)),
  );
  app.get("/api/rentals", (req, res) => res.json(service.rentals(req.query)));
  app.post("/api/rentals/quote", (req, res) => {
    const q = service.quote(req.body, req.body.rentalId);
    res.json({
      days: q.days,
      dailyRateCents: q.dailyRateCents,
      totalCents: q.totalCents,
      currency: q.currency,
    });
  });
  app.post("/api/rentals", (req, res) =>
    res.status(201).json(service.createRental(req.body, req.user.id)),
  );
  app.get("/api/rentals/:id", (req, res) =>
    res.json(service.rental(req.params.id)),
  );
  app.patch("/api/rentals/:id", (req, res) =>
    res.json(service.updateRental(req.params.id, req.body, req.user.id)),
  );
  app.post("/api/rentals/:id/pickup", (req, res) =>
    res.json(service.pickup(req.params.id, req.body, req.user.id)),
  );
  app.post("/api/rentals/:id/return", (req, res) =>
    res.json(service.returnRental(req.params.id, req.body, req.user.id)),
  );
  app.post("/api/rentals/:id/cancel", async (req, res) => {
    const p = service.currentPayment(req.params.id);
    if (p && p.status !== "paid")
      await payments.cancelLink(req.params.id, req.user.id);
    res.json(service.cancel(req.params.id, req.user.id));
  });
  app.post("/api/rentals/:id/payments/cash", (req, res) => {
    if (req.body?.received !== true)
      fail(400, "Confirm that the full cash amount was received");
    res.json(service.cash(req.params.id, req.user.id, req.body.reference));
  });
  app.post("/api/rentals/:id/payments/link", async (req, res) =>
    res.json(await payments.link(req.params.id, req.user.id)),
  );
  app.post("/api/rentals/:id/payments/cancel", async (req, res) =>
    res.json(await payments.cancelLink(req.params.id, req.user.id)),
  );
  app.post("/api/rentals/:id/payments/verify", async (req, res) => {
    const p = service.currentPayment(req.params.id);
    if (!p) fail(404, "No payment to verify");
    if (p.provider === "paypal" && p.status === "processing")
      await payments.capture(p);
    else await payments.reconcile(p);
    res.json(service.rental(req.params.id));
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found" }),
  );
  const webRoot = fileURLToPath(new URL("../web/dist/", import.meta.url));
  if (existsSync(`${webRoot}/index.html`)) {
    app.use(express.static(webRoot));
    app.get("/{*path}", (req, res) => res.sendFile(`${webRoot}/index.html`));
  }
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (/UNIQUE constraint failed/.test(error.message))
      return res.status(409).json({
        error:
          "This username, driver license, license plate, or payment already exists",
      });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON" });
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "Request is too large" });
    if (error instanceof HttpError)
      return res.status(error.status).json({ error: error.message });
    console.error("Request failed:", error.name, error.message);
    res
      .status(500)
      .json({ error: "Unable to complete this request. Please retry" });
  });
  return { app, db, service, payments, close: () => db.close() };
}
