import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { money, useResource } from "../api";
import { ErrorPanel, Icon, PageHead, RentalTable } from "../components";
import type { DashboardData } from "../types";
export default function Dashboard() {
  const { user } = useAuth(),
    resource = useResource<DashboardData>("/dashboard"),
    d = resource.data;
  return (
    <>
      <PageHead
        eyebrow="OPERATIONS AT A GLANCE"
        title={`Hello, ${user?.name.split(" ")[0]}.`}
        description="Everything you need to keep the day running smoothly."
      >
        <Link className="button primary" to="/rentals/new">
          <Icon name="plus" />
          New rental
        </Link>
      </PageHead>
      {resource.error && (
        <ErrorPanel error={resource.error} retry={resource.reload} />
      )}
      <section className="stat-grid">
        {[
          { label: "Active rentals", value: d?.activeRentals, icon: "key" },
          { label: "Reservations", value: d?.reservations, icon: "dashboard" },
          { label: "Fleet vehicles", value: d?.vehicles, icon: "car" },
          { label: "Active customers", value: d?.customers, icon: "people" },
        ].map((s) => (
          <div className="stat" key={s.label}>
            <span className="stat-icon">
              <Icon name={s.icon} />
            </span>
            <p>{s.label}</p>
            <strong>{s.value ?? "—"}</strong>
          </div>
        ))}
      </section>
      {!!d?.overdue && (
        <div className="notice">
          <strong>
            {d.overdue} overdue return{d.overdue > 1 ? "s" : ""}.
          </strong>{" "}
          Check active rentals before handing over another vehicle.
        </div>
      )}
      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-head">
            <div>
              <h2>Recent rentals</h2>
              <p className="muted">The latest activity across your business.</p>
            </div>
            <Link className="text-link" to="/rentals">
              View all
            </Link>
          </div>
          {d ? (
            <RentalTable rentals={d.recent} />
          ) : (
            <p className="loading" role="status">
              Loading rentals…
            </p>
          )}
        </div>
        <aside className="panel revenue-card">
          <span className="eyebrow">PAYMENTS RECEIVED</span>
          <h2>Keep the numbers clear.</h2>
          {d?.revenue.length ? (
            d.revenue.map((r) => (
              <div className="revenue-line" key={`${r.currency}-${r.mode}`}>
                <strong>{money(r.amountCents, r.currency)}</strong>
                <span className="muted">
                  {r.mode === "demo"
                    ? "Demo payments"
                    : r.mode === "sandbox"
                      ? "Sandbox payments"
                      : r.mode === "cash"
                        ? "Cash received"
                        : "Online payments"}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">
              Payments will appear here after cash is recorded or online payment
              is verified.
            </p>
          )}
          <div className="revenue-footer">
            <Icon />
            <p>One reliable record for every rental.</p>
          </div>
        </aside>
      </section>
      <section className="quick-links">
        {[
          {
            to: "/customers",
            title: "Customer directory",
            text: "Find a customer or add someone new.",
            icon: "people",
          },
          {
            to: "/vehicles",
            title: "Fleet management",
            text: "Update rates, mileage, and availability.",
            icon: "car",
          },
        ].map((a) => (
          <Link key={a.to} to={a.to}>
            <Icon name={a.icon} />
            <div>
              <h3>{a.title}</h3>
              <p className="muted">{a.text}</p>
            </div>
            <Icon name="arrow" />
          </Link>
        ))}
      </section>
    </>
  );
}
