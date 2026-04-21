"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:         { bg: "#dbeafe", text: "#1e40af" },
  in_progress: { bg: "#fef9c3", text: "#854d0e" },
  completed:   { bg: "#d1fae5", text: "#065f46" },
  cancelled:   { bg: "#fee2e2", text: "#991b1b" },
};

interface Interview {
  id: string;
  candidate_name: string | null;
  job_title: string | null;
  status: string | null;
  created_at: string;
}

export default function InterviewsPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetch(`${API_URL}/api/interviews`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch interviews");
        return res.json();
      })
      .then(setInterviews)
      .catch(() => setError("Could not load interviews. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Interviews</h1>
            <p style={styles.subtitle}>
              {loading ? "Loading…" : `${interviews.length} interviews total`}
            </p>
          </div>
          <button style={styles.createButton} onClick={() => router.push("/create_interview")}>
            Create Interview
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && interviews.length === 0 && (
          <p style={styles.muted}>No interviews yet.</p>
        )}

        {interviews.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Position</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((iv, i) => {
                  const status = iv.status ?? "new";
                  const badge = STATUS_COLORS[status] ?? { bg: "#e9ecef", text: "#495057" };
                  const date = new Date(iv.created_at).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  });
                  return (
                    <tr key={iv.id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{iv.candidate_name ?? "—"}</td>
                      <td style={styles.td}>{iv.job_title ?? "—"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: badge.bg, color: badge.text }}>
                          {status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: "#6c757d" }}>{date}</td>
                    </tr>
                  );
                })}
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
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
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
  title: { margin: 0, fontSize: "2rem", color: "#1a1a2e" },
  subtitle: { margin: "0.35rem 0 0", color: "#6c757d", fontSize: "0.95rem" },
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
  badge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  rowEven: { background: "#fff" },
  rowOdd: { background: "#fafafa" },
};
