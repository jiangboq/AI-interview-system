"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE, Page } from "@/lib/pagination";
import Pagination from "@/components/Pagination";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#fee2e2", text: "#991b1b" },
  recruiter: { bg: "#dbeafe", text: "#1e40af" },
  candidate: { bg: "#d1fae5", text: "#065f46" },
};

interface User {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  role: string | null;
  created_at: string | null;
}

export default function UsersPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetch(`${API_URL}/api/users?page=${page}&page_size=${DEFAULT_PAGE_SIZE}`, {
      headers: authHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data: Page<User>) => {
        setUsers(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      })
      .catch(() => setError("Could not load users. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [ready, page]);

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Users</h1>
            <p style={styles.subtitle}>{loading ? "Loading…" : `${total} users total`}</p>
          </div>
          <button style={styles.createButton} onClick={() => router.push("/create_user")}>
            Add User
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && users.length === 0 && <p style={styles.muted}>No users yet.</p>}

        {users.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const role = u.role ?? "";
                  const badge = ROLE_COLORS[role] ?? { bg: "#e9ecef", text: "#495057" };
                  return (
                    <tr key={u.id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{u.name ?? "—"}</td>
                      <td style={{ ...styles.td, color: "#6c757d" }}>{u.email ?? "—"}</td>
                      <td style={{ ...styles.td, color: "#6c757d" }}>{u.username ?? "—"}</td>
                      <td style={styles.td}>
                        {role ? (
                          <span style={{ ...styles.badge, background: badge.bg, color: badge.text }}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                        ) : (
                          <span style={{ color: "#adb5bd" }}>—</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, color: "#6c757d" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    padding: "3rem 2rem",
    background: "#f8f9fa",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  title: { margin: 0, fontSize: "2rem", color: "#1a1a2e" },
  subtitle: { margin: "0.35rem 0 0", color: "#6c757d", fontSize: "0.95rem" },
  createButton: {
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { color: "#dc3545", fontSize: "0.9rem", marginBottom: "1rem" },
  muted: { color: "#6c757d", fontSize: "0.95rem" },
  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
  },
  th: {
    textAlign: "left",
    padding: "0.85rem 1.25rem",
    fontWeight: 600,
    fontSize: "0.8rem",
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e9ecef",
    background: "#fff",
  },
  td: {
    padding: "0.85rem 1.25rem",
    color: "#1a1a2e",
    borderBottom: "1px solid #f1f3f5",
  },
  rowEven: { background: "#fff" },
  rowOdd: { background: "#fafafa" },
  badge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
};
