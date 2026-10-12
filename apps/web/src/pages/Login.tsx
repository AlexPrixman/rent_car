import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useResource } from "../api";
import { ErrorPanel, Icon } from "../components";
import type { Config } from "../types";
export default function Login() {
  const auth = useAuth(),
    config = useResource<Config>("/config");
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (auth.user) return <Navigate to="/" replace />;
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-symbol">
            <Icon />
          </span>
          rentdesk<span className="brand-dot">.</span>
        </div>
        <div>
          <p className="eyebrow">A SMOOTHER ROAD AHEAD</p>
          <h1>
            Your fleet.
            <br />
            Your customers.
            <br />
            <span>One workspace.</span>
          </h1>
          <p>
            Keep your rental business moving, from the first reservation to the
            final return.
          </p>
        </div>
        <p className="login-foot">Built for the people behind every journey.</p>
      </section>
      <section className="login-form-wrap">
        <div className="login-form">
          <p className="eyebrow">STAFF ACCESS</p>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to manage your rental operations.</p>
          {(error || auth.error) && (
            <ErrorPanel
              error={error || auth.error}
              retry={auth.error ? auth.retry : undefined}
            />
          )}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setBusy(true);
              try {
                await auth.login(username, password);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={30}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="primary wide" disabled={busy || auth.loading}>
              {busy ? "Signing in…" : "Sign in"}
              <Icon name="arrow" />
            </button>
          </form>
          {config.data?.demoLogin && (
            <div className="demo-login">
              <strong>Try the demo</strong>
              <p>
                Manager: <code>manager</code> · Employee: <code>employee</code>
              </p>
              <p>
                Password: <code>RentDesk123!</code>
              </p>
              <small>
                Shared sample workspace. Use fictional data only. Checkout
                simulates payment; no real charges.
              </small>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
