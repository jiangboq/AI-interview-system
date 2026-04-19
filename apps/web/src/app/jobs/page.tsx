"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  junior: { bg: "#d1fae5", text: "#065f46" },
  mid:    { bg: "#dbeafe", text: "#1e40af" },
  senior: { bg: "#ede9fe", text: "#4f46e5" },
  staff:  { bg: "#fee2e2", text: "#991b1b" },
};

interface Job {
  id: string;
  title: string | null;
  description: string | null;
  level: string | null;
}

export default function JobsPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetch(`${API_URL}/api/jobs`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch jobs");
        return res.json();
      })
      .then(setJobs)
      .catch(() => setError("Could not load jobs. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Open Positions</h1>
            <p style={styles.subtitle}>{loading ? "Loading…" : `${jobs.length} roles available`}</p>
          </div>
          <button style={styles.createButton} onClick={() => router.push("/create_job")}>
            Create a Job
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {loading && !error && <p style={styles.muted}>Loading jobs…</p>}

        <div style={styles.grid}>
          {jobs.map((job) => {
            const level = job.level ?? "";
            const badge = LEVEL_COLORS[level] ?? { bg: "#e9ecef", text: "#495057" };
            return (
              <div key={job.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.jobTitle}>{job.title ?? "Untitled"}</h2>
                  {level && (
                    <span style={{ ...styles.badge, background: badge.bg, color: badge.text }}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  )}
                </div>
                <p style={styles.description}>{job.description ?? "No description provided."}</p>
                <button style={styles.applyButton}>Add Candidate</button>
              </div>
            );
          })}
        </div>
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "1.25rem",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  jobTitle: { margin: 0, fontSize: "1.1rem", color: "#1a1a2e", fontWeight: 600 },
  badge: {
    flexShrink: 0,
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  description: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#495057",
    lineHeight: 1.6,
    flexGrow: 1,
  },
  applyButton: {
    alignSelf: "flex-start",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
