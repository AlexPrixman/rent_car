import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { money } from "./api";
import type { Rental } from "./types";
export function Icon({ name = "car" }: { name?: string }) {
  const paths: Record<string, ReactNode> = {
    car: (
      <>
        <path d="m5 8 2-4h10l2 4M3 9h18v9H3zM6 18v2m12-2v2M6 13h2m8 0h2" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-3-5" />
      </>
    ),
    key: (
      <>
        <circle cx="7" cy="8" r="4" />
        <path d="m10 11 10 10m-4-4 3-3m-6 0 3-3" />
      </>
    ),
    staff: (
      <>
        <path d="M4 4h16v16H4z" />
        <circle cx="12" cy="10" r="2" />
        <path d="M8 17a4 4 0 0 1 8 0" />
      </>
    ),
    arrow: <path d="M4 12h16m-5-5 5 5-5 5" />,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg
      className="icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.car}
    </svg>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge badge-${value.toLowerCase()}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
export function PageHead({
  eyebrow = "WORKSPACE",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </header>
  );
}
export function ErrorPanel({
  error,
  retry,
}: {
  error: string;
  retry?: () => void;
}) {
  return (
    <div className="alert" role="alert">
      {error}
      {retry && (
        <button className="text-button" onClick={retry}>
          Retry
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name="key" />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Pager({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pager">
      <span className="muted">
        {total} record{total !== 1 ? "s" : ""} · Page {page} of {pages}
      </span>
      <div>
        <button
          className="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <button
          className="secondary"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (
      ref.current?.querySelector<HTMLElement>(
        "input:not([disabled]),select:not([disabled]),textarea:not([disabled])",
      ) || ref.current?.querySelector<HTMLElement>("button")
    )?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) close.current();
          if (event.key === "Tab") {
            const elements = Array.from(
              ref.current?.querySelectorAll<HTMLElement>(
                "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
              ) || [],
            );
            const first = elements[0],
              last = elements.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header className="modal-head">
          <h2>{title}</h2>
          <button
            className="close-button"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={busy}
          >
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function RentalTable({ rentals }: { rentals: Rental[] }) {
  if (!rentals.length)
    return (
      <Empty title="No rentals yet">
        <p className="muted">Create a reservation to start your next rental.</p>
      </Empty>
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Rental / customer</th>
            <th>Vehicle</th>
            <th>Dates</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((r) => {
            const paid = r.payments.some((p) => p.status === "paid"),
              pending = r.payments.some((p) =>
                ["creating", "pending", "processing"].includes(p.status),
              );
            return (
              <tr key={r.id}>
                <td>
                  <strong>#{r.number}</strong>
                  <span className="cell-sub">{r.customerName}</span>
                </td>
                <td>
                  {r.vehicleLabel}
                  <span className="cell-sub">{r.plate}</span>
                </td>
                <td>
                  {r.startDate}
                  <span className="cell-sub">to {r.endDate}</span>
                </td>
                <td>
                  <strong>{money(r.totalCents, r.currency)}</strong>
                </td>
                <td>
                  <Badge value={r.status} />
                </td>
                <td>
                  <Badge
                    value={paid ? "paid" : pending ? "pending" : "unpaid"}
                  />
                </td>
                <td>
                  <Link
                    className="text-link"
                    to={`/rentals/${r.id}`}
                    aria-label={`Open rental ${r.number}`}
                  >
                    View <span aria-hidden="true">↗</span>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
