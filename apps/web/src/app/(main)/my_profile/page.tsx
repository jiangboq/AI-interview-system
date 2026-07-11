"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

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

function getInitials(user: User): string {
  const source = user.name ?? user.username ?? "";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
  return initials || "?";
}

export default function MyProfilePage() {
  const ready = useAuthGuard();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetch(`${API_URL}/api/users/me`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch current user");
        return res.json();
      })
      .then(setUser)
      .catch(() => setError("Could not load your profile. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  const role = user?.role ?? "";
  const badge = ROLE_COLORS[role] ?? { bg: "#e9ecef", text: "#495057" };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>My Profile</h1>
        <p style={styles.subtitle}>Your account details</p>

        {loading && <p style={styles.muted}>Loading…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {user && (
          <div style={styles.card}>
            <div style={styles.avatar}>{getInitials(user)}</div>
            <div style={styles.fields}>
              <div style={styles.field}>
                <span style={styles.label}>Name</span>
                <span style={styles.value}>{user.name ?? "—"}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Email</span>
                <span style={styles.value}>{user.email ?? "—"}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Username</span>
                <span style={styles.value}>{user.username ?? "—"}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Role</span>
                <span style={styles.value}>
                  {role ? (
                    <span style={{ ...styles.badge, background: badge.bg, color: badge.text }}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Member since</span>
                <span style={styles.value}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
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
    maxWidth: "560px",
    margin: "0 auto",
  },
  title: { margin: 0, fontSize: "2rem", color: "#1a1a2e" },
  subtitle: { margin: "0.35rem 0 2rem", color: "#6c757d", fontSize: "0.95rem" },
  muted: { color: "#6c757d", fontSize: "0.95rem" },
  error: { color: "#dc3545", fontSize: "0.9rem", marginBottom: "1rem" },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    padding: "2rem",
    display: "flex",
    gap: "1.75rem",
    alignItems: "flex-start",
  },
  avatar: {
    width: "4rem",
    height: "4rem",
    minWidth: "4rem",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "1.4rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    flex: 1,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    borderBottom: "1px solid #f1f3f5",
    paddingBottom: "0.75rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  value: { fontSize: "1rem", color: "#1a1a2e" },
  badge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
};
