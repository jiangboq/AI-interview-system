"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Candidate {
  id: string;
  full_name: string | null;
  email: string | null;
  resume_url: string | null;
}

export default function CandidatesPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetch(`${API_URL}/api/candidates`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch candidates");
        return res.json();
      })
      .then(setCandidates)
      .catch(() => setError("Could not load candidates. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Candidates</h1>
            <p style={styles.subtitle}>
              {loading ? "Loading…" : `${candidates.length} candidates total`}
            </p>
          </div>
          <button style={styles.createButton} onClick={() => router.push("/create_candidate")}>
            Add Candidate
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && candidates.length === 0 && (
          <p style={styles.muted}>No candidates yet.</p>
        )}

        {candidates.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Resume</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c.id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{c.full_name ?? "—"}</td>
                    <td style={{ ...styles.td, color: "#6c757d" }}>{c.email ?? "—"}</td>
                    <td style={styles.td}>
                      {c.resume_url ? (
                        <a
                          href={`${API_URL}${c.resume_url}`}
                          download
                          style={styles.resumeLink}
                        >
                          Download
                        </a>
                      ) : (
                        <span style={{ color: "#adb5bd" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    maxWidth: "700px",
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
  resumeLink: {
    color: "#4f46e5",
    fontWeight: 500,
    fontSize: "0.875rem",
    textDecoration: "none",
  },
};
