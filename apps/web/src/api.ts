import { useEffect, useState } from "react";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      !path.startsWith("/checkout/")
    )
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      response.status,
      body.error || "Unable to complete this request",
    );
  }
  return body;
}
export const send = <T>(path: string, body: unknown, method = "POST") =>
  api<T>(path, { method, body: JSON.stringify(body) });
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null),
    [dataPath, setDataPath] = useState<string | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value);
          setDataPath(path);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error.message || "Network request failed");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, tick]);
  return {
    data: dataPath === path ? data : null,
    error,
    loading,
    reload: () => setTick((value) => value + 1),
  };
}
export function useDebounced(value: string, delay = 250) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
export const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100,
  );
export const today = () => new Date().toISOString().slice(0, 10);
export const tomorrow = () =>
  new Date(Date.now() + 86400000).toISOString().slice(0, 10);
export const currentPayment = (payments: { status: string }[]) =>
  payments.find((p) =>
    ["creating", "pending", "processing", "paid"].includes(p.status),
  );
