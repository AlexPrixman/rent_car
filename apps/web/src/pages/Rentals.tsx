import { useState } from "react";
import { Link } from "react-router-dom";
import { useDebounced, useResource } from "../api";
import { ErrorPanel, Icon, PageHead, Pager, RentalTable } from "../components";
import type { List, Rental } from "../types";
export default function Rentals() {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    q = useDebounced(search);
  const resource = useResource<List<Rental>>(
    `/rentals?q=${encodeURIComponent(q)}&status=${status}&page=${page}`,
  );
  return (
    <>
      <PageHead
        title="Rentals"
        description="Every reservation, pickup, payment, and return in one place."
      >
        <Link className="button primary" to="/rentals/new">
          <Icon name="plus" />
          New rental
        </Link>
      </PageHead>
      {resource.error && (
        <ErrorPanel error={resource.error} retry={resource.reload} />
      )}
      <section className="panel">
        <div className="toolbar">
          <label className="search-label">
            <span className="sr-only">Search rentals</span>
            <input
              type="search"
              placeholder="Search by customer, vehicle, or rental number…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="filter-label">
            <span className="sr-only">Rental status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {["reserved", "active", "completed", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {resource.loading ? (
          <p className="loading" role="status">
            Loading rentals…
          </p>
        ) : (
          resource.data && <RentalTable rentals={resource.data.items} />
        )}{" "}
        {resource.data && (
          <Pager
            page={page}
            total={resource.data.total}
            pageSize={resource.data.pageSize}
            onChange={setPage}
          />
        )}
      </section>
    </>
  );
}
