"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LEVELS = ["junior", "mid", "senior", "staff"] as const;
type Level = (typeof LEVELS)[number];

interface Organization {
  id: string;
  name: string | null;
}

export default function CreateJobPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<Level>("mid");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetch(`${API_URL}/api/organizations`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch organizations");
        return res.json();
      })
      .then((data: Organization[]) => {
        setOrganizations(data);
        if (data.length > 0) setOrganizationId(data[0].id);
      })
      .catch(() => setError("Could not load organizations. Make sure the backend is running."));
  }, [ready]);

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!organizationId) {
      setError("Please select an organization.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title, description, level, organization_id: organizationId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Failed to create job");
      }
      router.push("/jobs");
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
            <h1 style={styles.title}>Create a Job</h1>
            <p style={styles.subtitle}>Add a new open position</p>
          </div>
          <button style={styles.backButton} onClick={() => router.push("/jobs")}>
            ← Back
          </button>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Job Title</label>
          <input
            style={styles.input}
            placeholder="e.g. Senior Software Engineer"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
          />

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

          <label style={styles.label}>Level</label>
          <select
            style={styles.input}
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>

          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, ...styles.textarea }}
            placeholder="Describe the role, responsibilities, and requirements…"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(""); }}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create Job"}
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
    maxWidth: "520px",
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
  textarea: {
    minHeight: "120px",
    resize: "vertical",
    fontFamily: "inherit",
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
