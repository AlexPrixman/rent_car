import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api, send } from "./api";
import type { User } from "./types";
type Auth = {
  user: User | null;
  loading: boolean;
  error: string;
  retry: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<User>("/auth/me", { signal: controller.signal })
      .then((u) => {
        if (!controller.signal.aborted) setUser(u);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setUser(null);
          if (e.status !== 401)
            setError(
              "Unable to reach the server. Check your connection and retry.",
            );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tick]);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  const value: Auth = {
    user,
    loading,
    error,
    retry: () => setTick((x) => x + 1),
    login: async (username, password) => {
      setUser(await send<User>("/auth/login", { username, password }));
      setError("");
    },
    logout: async () => {
      await send("/auth/logout", {});
      setUser(null);
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
export function Protected({ manager = false }: { manager?: boolean }) {
  const auth = useAuth();
  if (auth.loading)
    return (
      <div className="full-center" role="status">
        Loading your workspace…
      </div>
    );
  if (auth.error)
    return (
      <div className="full-center">
        <p role="alert">{auth.error}</p>
        <button onClick={auth.retry}>Retry connection</button>
      </div>
    );
  if (!auth.user) return <Navigate to="/login" replace />;
  if (manager && auth.user.role !== "Manager")
    return (
      <div className="panel">
        <h1>Manager access required</h1>
        <p>Only managers can manage employee accounts.</p>
      </div>
    );
  return <Outlet />;
}
