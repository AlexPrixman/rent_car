import { useState } from "react";
import { Link, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { Protected, useAuth } from "./auth";
import { useResource } from "./api";
import { ErrorPanel, Icon } from "./components";
import type { Config } from "./types";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
import Rentals from "./pages/Rentals";
import RentalForm from "./pages/RentalForm";
import RentalDetail, { Receipt } from "./pages/RentalDetail";
import Checkout from "./pages/Checkout";
function Layout() {
  const { user, logout } = useAuth(),
    config = useResource<Config>("/config"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const nav = [
    { to: "/", label: "Overview", icon: "dashboard" },
    { to: "/rentals", label: "Rentals", icon: "key" },
    { to: "/vehicles", label: "Vehicles", icon: "car" },
    { to: "/customers", label: "Customers", icon: "people" },
    ...(user?.role === "Manager"
      ? [{ to: "/employees", label: "Employees", icon: "staff" }]
      : []),
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-symbol">
            <Icon />
          </span>
          rentdesk<span className="brand-dot">.</span>
        </Link>
        <p className="sidebar-label">RENTAL OPERATIONS</p>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}>
              <Icon name={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="status-dot" />
            <span>
              {config.data?.paymentMode === "demo"
                ? "Demo workspace"
                : config.data?.paymentMode === "sandbox"
                  ? "Sandbox payments"
                  : "Rental workspace"}
            </span>
          </div>
          <div className="user-card">
            <span className="avatar">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
          {error && <ErrorPanel error={error} />}
          <button
            className="logout"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await logout();
              } catch {
                setError("Sign out failed. Retry.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            Rental operations <span className="topbar-divider">/</span>
            <strong>Staff workspace</strong>
          </span>
          <time>
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </header>
        <main id="main" className="main-content" tabIndex={-1}>
          {config.data?.demoLogin && (
            <div className="demo-note">
              Portfolio demo · shared sample data · no real charges. Please use
              fictional customer details.
            </div>
          )}
          <Outlet />
        </main>
        <footer className="workspace-footer">
          RentDesk · Every journey starts with a good handover.
        </footer>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/checkout/:token" element={<Checkout />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route
            path="customers"
            element={<Records key="customers" kind="customers" />}
          />
          <Route
            path="vehicles"
            element={<Records key="vehicles" kind="vehicles" />}
          />
          <Route path="rentals" element={<Rentals />} />
          <Route path="rentals/new" element={<RentalForm />} />
          <Route path="rentals/:id" element={<RentalDetail />} />
          <Route path="rentals/:id/edit" element={<RentalForm />} />
          <Route path="rentals/:id/receipt" element={<Receipt />} />
          <Route element={<Protected manager />}>
            <Route
              path="employees"
              element={<Records key="employees" kind="employees" />}
            />
          </Route>
          <Route
            path="*"
            element={
              <section className="panel">
                <h1>Page not found</h1>
                <Link to="/">Back to overview</Link>
              </section>
            }
          />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <section className="full-center">
            <h1>Page not found</h1>
            <Link to="/login">Sign in</Link>
          </section>
        }
      />
    </Routes>
  );
}
