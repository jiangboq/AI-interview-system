"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function CreateOrganizationPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Please enter an organization name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Failed to create organization");
      }
      router.push("/organizations");
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
          <div>
            <h1 style={styles.title}>Create Organization</h1>
            <p style={styles.subtitle}>Add a new organization</p>
          </div>
          <button style={styles.backButton} onClick={() => router.push("/organizations")}>
            ← Back
          </button>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            placeholder="e.g. Acme Corp"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Organization"}
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.75rem",
  },
  title: { margin: 0, fontSize: "1.75rem", color: "#1a1a2e" },
  subtitle: { margin: "0.25rem 0 0", color: "#6c757d", fontSize: "0.9rem" },
  backButton: {
    padding: "0.4rem 0.9rem",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    background: "#fff",
    color: "#6c757d",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
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
