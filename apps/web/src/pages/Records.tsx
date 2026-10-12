import { useState, type ReactNode } from "react";
import { money, send, useDebounced, useResource } from "../api";
import {
  Badge,
  Empty,
  ErrorPanel,
  Icon,
  Modal,
  PageHead,
  Pager,
} from "../components";
import type { Config, Customer, List, User, Vehicle } from "../types";
type Kind = "customers" | "vehicles" | "employees";
type RecordType = Customer | Vehicle | User;
type Values = Record<string, string | boolean>;
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  max?: number;
  min?: number;
  optional?: boolean;
};
const fields: Record<Kind, Field[]> = {
  customers: [
    { key: "name", label: "Full name" },
    { key: "email", label: "Email", type: "email", optional: true, max: 254 },
    { key: "phone", label: "Phone", max: 40 },
    { key: "licenseNumber", label: "Driver license", max: 60 },
  ],
  vehicles: [
    { key: "plate", label: "License plate", max: 20 },
    { key: "make", label: "Make", max: 60 },
    { key: "model", label: "Model", max: 60 },
    {
      key: "year",
      label: "Year",
      type: "number",
      min: 1980,
      max: new Date().getFullYear() + 1,
    },
    { key: "category", label: "Category", max: 40 },
    {
      key: "dailyRate",
      label: "Daily rate",
      type: "number",
      min: 0.01,
      max: 999999,
    },
    {
      key: "odometer",
      label: "Odometer",
      type: "number",
      min: 0,
      max: 10000000,
    },
    {
      key: "status",
      label: "Service status",
      options: ["available", "maintenance", "retired"],
    },
  ],
  employees: [
    { key: "name", label: "Full name" },
    { key: "username", label: "Username", max: 30 },
    { key: "role", label: "Role", options: ["Employee", "Manager"] },
    { key: "password", label: "Password", type: "password", max: 72 },
  ],
};
const descriptions: Record<Kind, string> = {
  customers:
    "Your customer directory, with contact details and driver licenses.",
  vehicles: "Manage your fleet, daily rates, service status, and mileage.",
  employees: "Create staff accounts and control who can access your business.",
};
function initialValues(kind: Kind, record: RecordType | null): Values {
  const defaults: Record<Kind, Values> = {
    customers: {
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      active: true,
    },
    vehicles: {
      plate: "",
      make: "",
      model: "",
      year: String(new Date().getFullYear()),
      category: "",
      dailyRate: "",
      odometer: "0",
      status: "available",
    },
    employees: {
      name: "",
      username: "",
      role: "Employee",
      password: "",
      active: true,
    },
  };
  if (!record) return defaults[kind];
  const result = { ...defaults[kind], ...record } as unknown as Values;
  if (kind === "vehicles")
    result.dailyRate = ((record as Vehicle).dailyRateCents / 100).toFixed(2);
  result.password = "";
  return result;
}
function RecordForm({
  kind,
  record,
  onClose,
  onSaved,
}: {
  kind: Kind;
  record: RecordType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(() => initialValues(kind, record)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const singular =
    kind === "customers"
      ? "customer"
      : kind === "vehicles"
        ? "vehicle"
        : "employee";
  return (
    <Modal
      title={`${record ? "Edit" : "Add"} ${singular}`}
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await send(
              `/${kind}${record ? `/${record.id}` : ""}`,
              values,
              record ? "PATCH" : "POST",
            );
            onSaved();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && <ErrorPanel error={error} />}
        <fieldset disabled={busy}>
          <div className="form-grid">
            {fields[kind].map((field) => (
              <label key={field.key}>
                {field.label}
                {field.optional && (
                  <span className="optional"> (optional)</span>
                )}
                {field.options ? (
                  <select
                    aria-label={field.label}
                    value={String(values[field.key])}
                    onChange={(e) =>
                      setValues({ ...values, [field.key]: e.target.value })
                    }
                  >
                    {field.options.map((o) => (
                      <option key={o} value={o}>
                        {o[0].toUpperCase() + o.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.key}
                    type={field.type || "text"}
                    value={String(values[field.key] ?? "")}
                    onChange={(e) =>
                      setValues({ ...values, [field.key]: e.target.value })
                    }
                    required={
                      !field.optional && !(record && field.key === "password")
                    }
                    maxLength={
                      field.type === "number" ? undefined : field.max || 120
                    }
                    max={field.type === "number" ? field.max : undefined}
                    min={field.min}
                    minLength={
                      field.key === "password"
                        ? 10
                        : field.key === "username"
                          ? 3
                          : undefined
                    }
                    step={
                      field.key === "dailyRate"
                        ? "0.01"
                        : field.type === "number"
                          ? "1"
                          : undefined
                    }
                    disabled={Boolean(record && field.key === "username")}
                    autoComplete={
                      field.key === "password" ? "new-password" : "off"
                    }
                  />
                )}
              </label>
            ))}
          </div>
          {record && kind !== "vehicles" && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={Boolean(values.active)}
                onChange={(e) =>
                  setValues({ ...values, active: e.target.checked })
                }
              />
              {kind === "employees" ? "Account active" : "Customer active"}
            </label>
          )}
          {kind === "employees" && (
            <p className="form-hint">
              {record
                ? "Leave password empty to keep it. Changing it signs out existing sessions."
                : "Use at least 10 characters for the password."}{" "}
              Managers can manage employee accounts; employees can manage
              customers, vehicles, and rentals.
            </p>
          )}
          {record && kind === "customers" && (
            <p className="form-hint">
              Archived customers remain in rental history. Complete or cancel
              their open rentals before archiving.
            </p>
          )}
          <footer className="form-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="primary">
              {busy ? "Saving…" : `Save ${singular}`}
            </button>
          </footer>
        </fieldset>
      </form>
    </Modal>
  );
}
export default function Records({ kind }: { kind: Kind }) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [modal, setModal] = useState<{ record: RecordType | null } | null>(null),
    [notice, setNotice] = useState("");
  const q = useDebounced(search),
    resource = useResource<List<RecordType>>(
      `/${kind}?q=${encodeURIComponent(q)}&page=${page}`,
    ),
    config = useResource<Config>("/config");
  const title = kind[0].toUpperCase() + kind.slice(1),
    singular =
      kind === "customers"
        ? "customer"
        : kind === "vehicles"
          ? "vehicle"
          : "employee";
  const columns: Record<
    Kind,
    { label: string; render: (r: RecordType) => ReactNode }[]
  > = {
    customers: [
      {
        label: "Customer",
        render: (r) => (
          <>
            <strong>{(r as Customer).name}</strong>
            <span className="cell-sub">
              {(r as Customer).email || "No email"}
            </span>
          </>
        ),
      },
      { label: "Phone", render: (r) => (r as Customer).phone },
      { label: "Driver license", render: (r) => (r as Customer).licenseNumber },
      {
        label: "Status",
        render: (r) => (
          <Badge value={(r as Customer).active ? "active" : "archived"} />
        ),
      },
    ],
    vehicles: [
      {
        label: "Vehicle",
        render: (r) => (
          <>
            <strong>
              {(r as Vehicle).make} {(r as Vehicle).model}
            </strong>
            <span className="cell-sub">
              {(r as Vehicle).year} · {(r as Vehicle).category}
            </span>
          </>
        ),
      },
      { label: "License plate", render: (r) => (r as Vehicle).plate },
      {
        label: "Daily rate",
        render: (r) =>
          money((r as Vehicle).dailyRateCents, (r as Vehicle).currency),
      },
      {
        label: "Odometer",
        render: (r) => (r as Vehicle).odometer.toLocaleString(),
      },
      {
        label: "Service status",
        render: (r) => <Badge value={(r as Vehicle).status} />,
      },
    ],
    employees: [
      {
        label: "Employee",
        render: (r) => (
          <>
            <strong>{(r as User).name}</strong>
            <span className="cell-sub">@{(r as User).username}</span>
          </>
        ),
      },
      { label: "Role", render: (r) => <Badge value={(r as User).role} /> },
      {
        label: "Access",
        render: (r) => (
          <Badge value={(r as User).active ? "active" : "inactive"} />
        ),
      },
    ],
  };
  return (
    <>
      <PageHead title={title} description={descriptions[kind]}>
        <button className="primary" onClick={() => setModal({ record: null })}>
          <Icon name="plus" />
          Add {singular}
        </button>
      </PageHead>
      {notice && (
        <div className="success-note" role="status">
          {notice}
        </div>
      )}
      {resource.error && (
        <ErrorPanel error={resource.error} retry={resource.reload} />
      )}
      <section className="panel">
        <div className="toolbar">
          <label className="search-label">
            <span className="sr-only">Search {kind}</span>
            <input
              type="search"
              placeholder={`Search ${kind}…`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <span className="muted">
            {kind === "vehicles"
              ? `Rates in ${config.data?.currency || "USD"} · availability checked per booking`
              : kind === "employees"
                ? "Manager access only"
                : "Records are preserved in rental history"}
          </span>
        </div>
        {resource.loading ? (
          <p className="loading" role="status">
            Loading {kind}…
          </p>
        ) : resource.data?.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns[kind].map((c) => (
                    <th key={c.label}>{c.label}</th>
                  ))}
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resource.data.items.map((r) => (
                  <tr key={r.id}>
                    {columns[kind].map((c) => (
                      <td key={c.label}>{c.render(r)}</td>
                    ))}
                    <td>
                      <button
                        className="text-button"
                        aria-label={`Edit ${"name" in r ? r.name : `${r.make} ${r.model}`}`}
                        onClick={() => setModal({ record: r })}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={q ? "No matching records" : `No ${kind} yet`}>
            <p className="muted">
              {q
                ? "Try a different search."
                : `Add your first ${singular} to get started.`}
            </p>
          </Empty>
        )}
        {resource.data && (
          <Pager
            page={page}
            total={resource.data.total}
            pageSize={resource.data.pageSize}
            onChange={setPage}
          />
        )}
      </section>
      {modal && (
        <RecordForm
          kind={kind}
          record={modal.record}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setNotice(
              `${singular[0].toUpperCase() + singular.slice(1)} saved.`,
            );
            resource.reload();
          }}
        />
      )}
    </>
  );
}
