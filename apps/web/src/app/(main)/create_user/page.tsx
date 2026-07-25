"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ROLES = [
  { value: "recruiter", label: "HR user" },
  { value: "admin", label: "Admin" },
] as const;

interface Organization {
  id: string;
  name: string | null;
}

export default function CreateUserPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("recruiter");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetch(`${API_URL}/api/organizations?page_size=100`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch organizations");
        return res.json();
      })
      .then((data: { items: Organization[] }) => {
        setOrganizations(data.items);
        if (data.items.length > 0) setOrganizationId(data.items[0].id);
      })
      .catch(() => setError("Could not load organizations. Make sure the backend is running."));
  }, [ready]);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!organizationId) {
      setError("Please select an organization.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, email, username, password, role, organization_id: organizationId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Failed to create user");
      }
      router.push("/users");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Add User</h1>
          <p style={styles.subtitle}>Create a new user account</p>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Full Name</label>
          <input
            style={styles.input}
            placeholder="e.g. Jane Smith"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            placeholder="e.g. jane.smith@example.com"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
          />

          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            placeholder="e.g. jsmith"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            placeholder="Choose a password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
          />

          <label style={styles.label}>Role</label>
          <select
            style={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number]["value"])}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <label style={styles.label}>Organization</label>
          <select
            style={styles.input}
            value={organizationId}
            onChange={(e) => { setOrganizationId(e.target.value); setError(""); }}
          >
            {organizations.length === 0 && <option value="">No organizations available</option>}
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name ?? o.id}
              </option>
            ))}
          </select>

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding…" : "Add User"}
          </button>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    background: "#f8f9fa",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "480px",
  },
  header: {
    marginBottom: "1.75rem",
  },
  title: { margin: 0, fontSize: "1.75rem", color: "#1a1a2e" },
  subtitle: { margin: "0.25rem 0 0", color: "#6c757d", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  label: { fontWeight: 600, fontSize: "0.875rem", color: "#333" },
  input: {
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    fontSize: "1rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: { color: "#dc3545", fontSize: "0.875rem", margin: 0 },
  button: {
    marginTop: "0.5rem",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
