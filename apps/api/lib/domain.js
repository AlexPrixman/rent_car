import { randomUUID, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { atomic } from "./db.js";
import {
  fail,
  text,
  choice,
  integer,
  boolean,
  password,
  duration,
  customerInput,
  vehicleInput,
} from "./validation.js";
const camel = (row) =>
  row &&
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      value,
    ]),
  );
export const publicUser = (row) =>
  row && {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    active: Boolean(row.active),
  };
const publicCustomer = (row) =>
  row && {
    ...camel(row),
    active: Boolean(row.active),
  };
export const publicPayment = (row) =>
  row && {
    id: row.id,
    provider: row.provider,
    mode: row.mode,
    status: row.status,
    amountCents: row.amount_cents,
    currency: row.currency,
    checkoutUrl: row.checkout_url,
    reference: row.reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
export class RentalService {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }
  async get(sql, ...args) {
    return await this.db.prepare(sql).get(...args);
  }
  async all(sql, ...args) {
    return await this.db.prepare(sql).all(...args);
  }
  async run(sql, ...args) {
    return await this.db.prepare(sql).run(...args);
  }
  async audit(actor, action, id) {
    await this.run(
      "INSERT INTO audit_log(actor_id,action,entity_id) VALUES (?,?,?)",
      actor,
      action,
      id,
    );
  }
  async manager(actor) {
    if (!actor) return; // First account creation through the local seed command.
    const user = await this.required("users", actor);
    if (!user.active || user.role !== "Manager")
      fail(403, "Only active managers can manage employees");
  }
  async required(table, id) {
    const row = await this.get(`SELECT * FROM ${table} WHERE id=?`, id);
    if (!row) fail(404, "Record not found");
    return row;
  }
  async list(table, query = {}) {
    const page = integer(query.page ?? 1, "Page", 1, 100000);
    const pageSize = integer(query.pageSize ?? 20, "Page size", 1, 100);
    const q = typeof query.q === "string" ? query.q.slice(0, 120) : "";
    const fields =
      table === "customers"
        ? "name || phone || license_number || email"
        : table === "vehicles"
          ? "make || model || plate || category"
          : "username || name";
    let where = `WHERE lower(${fields}) LIKE lower(?) ESCAPE '\\'`;
    const params = [`%${q.replace(/[\\%_]/g, "\\$&")}%`];
    if (query.active === "true" && table !== "vehicles")
      where += " AND active=1";
    if (query.status && table === "vehicles") {
      choice(query.status, ["available", "maintenance", "retired"], "Status");
      where += " AND status=?";
      params.push(query.status);
    }
    const total = (
      await this.get(`SELECT COUNT(*) AS n FROM ${table} ${where}`, ...params)
    ).n;
    const rows = await this.all(
      `SELECT * FROM ${table} ${where} ORDER BY created_at DESC,id LIMIT ? OFFSET ?`,
      ...params,
      pageSize,
      (page - 1) * pageSize,
    );
    return {
      items: rows.map(
        table === "users"
          ? publicUser
          : table === "customers"
            ? publicCustomer
            : camel,
      ),
      total,
      page,
      pageSize,
    };
  }
  async createUser(body, actor) {
    const username = text(body.username, "Username", {
      max: 30,
    }).toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(username))
      fail(
        400,
        "Username must contain 3–30 letters, digits, dots, underscores, or hyphens",
      );
    const name = text(body.name, "Name");
    const role = choice(body.role, ["Manager", "Employee"], "Role");
    const hash = await bcrypt.hash(password(body.password), 12);
    const id = randomUUID();
    await atomic(this.db, async () => {
      await this.manager(actor);
      await this.run(
        "INSERT INTO users(id,username,name,password_hash,role) VALUES (?,?,?,?,?)",
        id,
        username,
        name,
        hash,
        role,
      );
      await this.audit(actor, "employee.created", id);
    });
    return publicUser(await this.required("users", id));
  }
  async updateUser(id, body, actor) {
    const name = text(body.name, "Name");
    const role = choice(body.role, ["Manager", "Employee"], "Role");
    const active = boolean(body.active, "Active");
    if (id === actor && (!active || role !== "Manager"))
      fail(409, "You cannot deactivate or demote your own manager account");
    const hash = body.password
      ? await bcrypt.hash(password(body.password), 12)
      : null;
    return await atomic(this.db, async () => {
      await this.manager(actor);
      const row = await this.required("users", id);
      if (
        row.active &&
        row.role === "Manager" &&
        (!active || role !== "Manager") &&
        (
          await this.get(
            "SELECT COUNT(*) AS n FROM users WHERE active=1 AND role='Manager'",
          )
        ).n <= 1
      )
        fail(409, "Keep at least one active manager");
      await this.run(
        "UPDATE users SET name=?,role=?,active=?,password_hash=?,session_version=session_version+?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        name,
        role,
        active,
        hash || row.password_hash,
        hash || !active ? 1 : 0,
        id,
      );
      await this.audit(actor, "employee.updated", id);
      return publicUser(await this.required("users", id));
    });
  }
  async createCustomer(body, actor) {
    const v = customerInput(body),
      id = randomUUID();
    await atomic(this.db, async () => {
      await this.run(
        "INSERT INTO customers(id,name,email,phone,license_number) VALUES (?,?,?,?,?)",
        id,
        v.name,
        v.email,
        v.phone,
        v.license,
      );
      await this.audit(actor, "customer.created", id);
    });
    return publicCustomer(await this.required("customers", id));
  }
  async updateCustomer(id, body, actor) {
    const v = customerInput(body),
      active = boolean(body.active, "Active");
    return await atomic(this.db, async () => {
      await this.required("customers", id);
      if (
        !active &&
        (await this.get(
          "SELECT id FROM rentals WHERE customer_id=? AND status IN ('reserved','active') LIMIT 1",
          id,
        ))
      )
        fail(
          409,
          "Complete or cancel this customer’s open rentals before archiving",
        );
      await this.run(
        "UPDATE customers SET name=?,email=?,phone=?,license_number=?,active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        v.name,
        v.email,
        v.phone,
        v.license,
        active,
        id,
      );
      await this.audit(actor, "customer.updated", id);
      return publicCustomer(await this.required("customers", id));
    });
  }
  async createVehicle(body, actor) {
    const v = vehicleInput(body),
      id = randomUUID();
    await atomic(this.db, async () => {
      await this.run(
        "INSERT INTO vehicles(id,plate,make,model,year,category,daily_rate_cents,currency,status,odometer) VALUES (?,?,?,?,?,?,?,?,?,?)",
        id,
        v.plate,
        v.make,
        v.model,
        v.year,
        v.category,
        v.rate,
        this.config.currency,
        v.status,
        v.odometer,
      );
      await this.audit(actor, "vehicle.created", id);
    });
    return camel(await this.required("vehicles", id));
  }
  async updateVehicle(id, body, actor) {
    const v = vehicleInput(body);
    return await atomic(this.db, async () => {
      const current = await this.required("vehicles", id);
      if (v.odometer < current.odometer) fail(400, "Odometer cannot decrease");
      if (
        v.status !== "available" &&
        (await this.get(
          "SELECT id FROM rentals WHERE vehicle_id=? AND status IN ('reserved','active') LIMIT 1",
          id,
        ))
      )
        fail(
          409,
          "Complete or cancel open rentals before changing vehicle availability",
        );
      if (
        v.odometer !== current.odometer &&
        (await this.get(
          "SELECT id FROM rentals WHERE vehicle_id=? AND status='active' LIMIT 1",
          id,
        ))
      )
        fail(409, "Record the new odometer when returning the active rental");
      await this.run(
        "UPDATE vehicles SET plate=?,make=?,model=?,year=?,category=?,daily_rate_cents=?,status=?,odometer=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        v.plate,
        v.make,
        v.model,
        v.year,
        v.category,
        v.rate,
        v.status,
        v.odometer,
        id,
      );
      await this.audit(actor, "vehicle.updated", id);
      return camel(await this.required("vehicles", id));
    });
  }
  async quote(body, except = "") {
    const days = duration(body.startDate, body.endDate);
    if (body.startDate < new Date().toISOString().slice(0, 10))
      fail(400, "Pickup date cannot be in the past");
    const v = await this.required("vehicles", text(body.vehicleId, "Vehicle"));
    if (v.status !== "available")
      fail(409, "Vehicle is not available for rentals");
    const conflict = await this.get(
      `SELECT number FROM rentals WHERE vehicle_id=? AND id<>? AND status IN ('reserved','active')
      AND ((start_date<? AND end_date>?) OR (status='active' AND end_date<=?)) LIMIT 1`,
      v.id,
      except,
      body.endDate,
      body.startDate,
      new Date().toISOString().slice(0, 10),
    );
    if (conflict)
      fail(
        409,
        `Vehicle is unavailable: rental #${conflict.number} overlaps or is overdue`,
      );
    return {
      days,
      dailyRateCents: v.daily_rate_cents,
      totalCents: days * v.daily_rate_cents,
      currency: v.currency,
      vehicle: v,
    };
  }
  async createRental(body, actor) {
    const method = choice(
      body.paymentMethod,
      ["cash", "stripe", "paypal"],
      "Payment method",
    );
    const notes = text(body.notes, "Notes", {
      optional: true,
      max: 2000,
    });
    return await atomic(this.db, async () => {
      const c = await this.required(
        "customers",
        text(body.customerId, "Customer"),
      );
      if (!c.active) fail(409, "Customer is archived");
      const q = await this.quote(body),
        id = randomUUID();
      await this.run("UPDATE counters SET value=value+1 WHERE name='rental'");
      const number = (
        await this.get("SELECT value FROM counters WHERE name='rental'")
      ).value;
      await this.run(
        `INSERT INTO rentals(id,number,customer_id,vehicle_id,customer_name,vehicle_label,plate,start_date,end_date,days,daily_rate_cents,total_cents,currency,payment_method,status,notes,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'reserved',?,?)`,
        id,
        number,
        c.id,
        q.vehicle.id,
        c.name,
        `${q.vehicle.make} ${q.vehicle.model}`,
        q.vehicle.plate,
        body.startDate,
        body.endDate,
        q.days,
        q.dailyRateCents,
        q.totalCents,
        q.currency,
        method,
        notes,
        actor,
      );
      await this.audit(actor, "rental.created", id);
      return await this.rental(id);
    });
  }
  async rental(id) {
    const row = await this.required("rentals", id);
    return {
      ...camel(row),
      payments: (
        await this.all(
          "SELECT * FROM payments WHERE rental_id=? ORDER BY created_at,id",
          id,
        )
      ).map(publicPayment),
    };
  }
  async rentals(query = {}) {
    const page = integer(query.page ?? 1, "Page", 1, 100000),
      pageSize = integer(query.pageSize ?? 20, "Page size", 1, 100);
    let where =
      "WHERE lower(customer_name || vehicle_label || plate || number) LIKE lower(?) ESCAPE '\\'";
    const params = [
      `%${String(query.q || "")
        .slice(0, 120)
        .replace(/[\\%_]/g, "\\$&")}%`,
    ];
    if (query.status) {
      where += " AND status=?";
      params.push(
        choice(
          query.status,
          ["reserved", "active", "completed", "cancelled"],
          "Status",
        ),
      );
    }
    const total = (
      await this.get(`SELECT COUNT(*) AS n FROM rentals ${where}`, ...params)
    ).n;
    const items = await Promise.all(
      (
        await this.all(
          `SELECT id FROM rentals ${where} ORDER BY created_at DESC,number DESC LIMIT ? OFFSET ?`,
          ...params,
          pageSize,
          (page - 1) * pageSize,
        )
      ).map(async (r) => await this.rental(r.id)),
    );
    return {
      items,
      total,
      page,
      pageSize,
    };
  }
  async updateRental(id, body, actor) {
    return await atomic(this.db, async () => {
      const r = await this.required("rentals", id),
        notes = text(body.notes, "Notes", {
          optional: true,
          max: 2000,
        });
      const terms = [
        "customerId",
        "vehicleId",
        "startDate",
        "endDate",
        "paymentMethod",
      ];
      const changed = terms.some(
        (key) => body[key] !== undefined && body[key] !== camel(r)[key],
      );
      if (changed) {
        if (r.status !== "reserved" || (await this.currentPayment(id)))
          fail(
            409,
            "Rental terms are locked after payment or a checkout link; cancel an unpaid link before editing",
          );
        const c = await this.required(
          "customers",
          text(body.customerId, "Customer"),
        );
        if (!c.active) fail(409, "Customer is archived");
        const q = await this.quote(body, id),
          method = choice(
            body.paymentMethod,
            ["cash", "stripe", "paypal"],
            "Payment method",
          );
        await this.run(
          "UPDATE rentals SET customer_id=?,vehicle_id=?,customer_name=?,vehicle_label=?,plate=?,start_date=?,end_date=?,days=?,daily_rate_cents=?,total_cents=?,currency=?,payment_method=? WHERE id=?",
          c.id,
          q.vehicle.id,
          c.name,
          `${q.vehicle.make} ${q.vehicle.model}`,
          q.vehicle.plate,
          body.startDate,
          body.endDate,
          q.days,
          q.dailyRateCents,
          q.totalCents,
          q.currency,
          method,
          id,
        );
      }
      await this.run(
        "UPDATE rentals SET notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        notes,
        id,
      );
      await this.audit(actor, "rental.updated", id);
      return await this.rental(id);
    });
  }
  async currentPayment(id) {
    return await this.get(
      "SELECT * FROM payments WHERE rental_id=? AND status IN ('creating','pending','processing','paid')",
      id,
    );
  }
  async allocatePayment(id, actor) {
    return await atomic(this.db, async () => {
      const r = await this.required("rentals", id);
      if (r.status !== "reserved")
        fail(409, "Payments can only be created for reserved rentals");
      if (r.payment_method === "cash") fail(409, "This rental uses cash");
      const existing = await this.currentPayment(id);
      if (existing) {
        if (existing.status === "paid") fail(409, "Rental is already paid");
        return existing;
      }
      const paymentId = randomUUID();
      await this.run(
        `INSERT INTO payments(id,rental_id,provider,mode,status,amount_cents,currency,public_token,created_by)
        VALUES (?,?,?,?,'creating',?,?,?,?)`,
        paymentId,
        id,
        r.payment_method,
        this.config.mode,
        r.total_cents,
        r.currency,
        randomBytes(32).toString("hex"),
        actor,
      );
      await this.audit(actor, "payment.link_requested", paymentId);
      return await this.required("payments", paymentId);
    });
  }
  async cash(id, actor, reference) {
    return await atomic(this.db, async () => {
      const r = await this.required("rentals", id),
        existing = await this.currentPayment(id);
      if (existing?.status === "paid" && existing.provider === "cash")
        return await this.rental(id);
      if (r.status !== "reserved" || r.payment_method !== "cash")
        fail(409, "Cash is only accepted for reserved cash rentals");
      if (existing) fail(409, "A payment already exists");
      const paymentId = randomUUID();
      await this.run(
        `INSERT INTO payments(id,rental_id,provider,mode,status,amount_cents,currency,public_token,reference,created_by)
        VALUES (?,?,'cash','cash','paid',?,?,?,?,?)`,
        paymentId,
        id,
        r.total_cents,
        r.currency,
        randomBytes(32).toString("hex"),
        text(reference, "Reference", {
          optional: true,
          max: 120,
        }),
        actor,
      );
      await this.audit(actor, "payment.cash_received", paymentId);
      return await this.rental(id);
    });
  }
  async settle(payment, verified, event = null) {
    return await atomic(this.db, async () => {
      const p = await this.required("payments", payment.id);
      if (
        verified.amountCents !== p.amount_cents ||
        verified.currency !== p.currency ||
        verified.externalId !== p.external_id ||
        verified.mode !== p.mode
      )
        fail(400, "Verified payment does not match this rental");
      if (
        event &&
        (await this.get(
          "SELECT 1 FROM webhook_events WHERE provider=? AND event_id=?",
          p.provider,
          event,
        ))
      )
        return;
      if (p.status !== "paid") {
        await this.run(
          "UPDATE payments SET status='paid',reference=?,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?",
          verified.reference || p.external_id,
          p.id,
        );
        await this.audit(null, "payment.verified", p.id);
      }
      if (event)
        await this.run(
          "INSERT INTO webhook_events(provider,event_id) VALUES (?,?)",
          p.provider,
          event,
        );
    });
  }
  async cancel(id, actor) {
    return await atomic(this.db, async () => {
      const r = await this.required("rentals", id),
        p = await this.currentPayment(id);
      if (r.status === "cancelled") return await this.rental(id);
      if (r.status !== "reserved")
        fail(
          409,
          "Only reserved rentals can be cancelled; active rentals must be returned",
        );
      if (p && ["creating", "processing"].includes(p.status))
        fail(409, "Payment is being processed; retry after verification");
      if (p && p.status !== "paid")
        await this.run(
          "UPDATE payments SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?",
          p.id,
        );
      await this.run(
        "UPDATE rentals SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?",
        id,
      );
      await this.audit(actor, "rental.cancelled", id);
      return await this.rental(id);
    });
  }
  async pickup(id, body, actor) {
    return await atomic(this.db, async () => {
      const r = await this.required("rentals", id),
        v = await this.required("vehicles", r.vehicle_id),
        p = await this.currentPayment(id);
      if (r.status !== "reserved" || p?.status !== "paid")
        fail(409, "Rental must be reserved and fully paid before pickup");
      if (
        v.status !== "available" ||
        (await this.get(
          "SELECT id FROM rentals WHERE vehicle_id=? AND status='active' LIMIT 1",
          v.id,
        ))
      )
        fail(409, "Vehicle is unavailable or has not been returned");
      const today = new Date().toISOString().slice(0, 10);
      if (today < r.start_date || today >= r.end_date)
        fail(
          409,
          "Pickup must happen during the booked date range; edit an unpaid reservation to reschedule",
        );
      const odometer = integer(body.odometer, "Pickup odometer", v.odometer);
      await this.run(
        "UPDATE rentals SET status='active',pickup_odometer=?,picked_up_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        odometer,
        id,
      );
      await this.run(
        "UPDATE vehicles SET odometer=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        odometer,
        v.id,
      );
      await this.audit(actor, "rental.picked_up", id);
      return await this.rental(id);
    });
  }
  async returnRental(id, body, actor) {
    return await atomic(this.db, async () => {
      const r = await this.required("rentals", id);
      if (r.status !== "active")
        fail(409, "Only active rentals can be returned");
      const odometer = integer(
        body.odometer,
        "Return odometer",
        r.pickup_odometer,
      );
      await this.run(
        "UPDATE rentals SET status='completed',return_odometer=?,returned_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        odometer,
        id,
      );
      await this.run(
        "UPDATE vehicles SET odometer=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        odometer,
        r.vehicle_id,
      );
      await this.audit(actor, "rental.returned", id);
      return await this.rental(id);
    });
  }
  async dashboard() {
    return {
      customers: (
        await this.get("SELECT COUNT(*) AS n FROM customers WHERE active=1")
      ).n,
      vehicles: (
        await this.get(
          "SELECT COUNT(*) AS n FROM vehicles WHERE status<>'retired'",
        )
      ).n,
      activeRentals: (
        await this.get(
          "SELECT COUNT(*) AS n FROM rentals WHERE status='active'",
        )
      ).n,
      reservations: (
        await this.get(
          "SELECT COUNT(*) AS n FROM rentals WHERE status='reserved'",
        )
      ).n,
      overdue: (
        await this.get(
          "SELECT COUNT(*) AS n FROM rentals WHERE status='active' AND end_date<=?",
          new Date().toISOString().slice(0, 10),
        )
      ).n,
      revenue: await this.all(
        "SELECT currency,mode,SUM(amount_cents) AS \"amountCents\" FROM payments WHERE status='paid' GROUP BY currency,mode",
      ),
      recent: (
        await this.rentals({
          pageSize: 5,
        })
      ).items,
    };
  }
}
