"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  junior: { bg: "#d1fae5", text: "#065f46" },
  mid:    { bg: "#dbeafe", text: "#1e40af" },
  senior: { bg: "#ede9fe", text: "#4f46e5" },
  staff:  { bg: "#fee2e2", text: "#991b1b" },
};

interface ParsedRequirements {
  required_skills?: string[];
  preferred_skills?: string[];
  min_years_experience?: number;
  education_requirements?: string[];
  key_responsibilities?: string[];
}

interface JobDetail {
  id: string;
  title: string | null;
  description: string | null;
  level: string | null;
  interview_type: string | null;
  status: string | null;
  organization_id: string | null;
  organization_name: string | null;
  parsed_requirements: ParsedRequirements | null;
  created_at: string;
  updated_at: string;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function JobDetailPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const params = useParams<{ job_id: string }>();
  const jobId = params.job_id;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;

    fetch(`${API_URL}/api/jobs/${jobId}`, { headers: authHeaders() })
      .then((res) => {
        if (res.status === 404) throw new Error("not_found");
        if (!res.ok) throw new Error("Failed to fetch job");
        return res.json();
      })
      .then(setJob)
      .catch((err) =>
        setError(
          err.message === "not_found"
            ? "Job not found."
            : "Could not load job. Make sure the backend is running."
        )
      )
      .finally(() => setLoading(false));
  }, [ready, jobId]);

  if (!ready) return null;

  const level = job?.level ?? "";
  const badge = LEVEL_COLORS[level] ?? { bg: "#e9ecef", text: "#495057" };
  const req = job?.parsed_requirements;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => router.push("/jobs")}>
          ← Back to jobs
        </button>

        {loading && <p style={styles.muted}>Loading…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && job && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>{job.title ?? "Untitled"}</h1>
                <p style={styles.subtitle}>{job.organization_name ?? "Unaffiliated"}</p>
              </div>
              <div style={styles.badges}>
                {level && (
                  <span style={{ ...styles.badge, background: badge.bg, color: badge.text }}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                )}
                {job.status && (
                  <span style={{ ...styles.badge, background: "#e9ecef", color: "#495057" }}>
                    {job.status}
                  </span>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Overview</h2>
              <div style={styles.grid}>
                <div>
                  <p style={styles.label}>Interview type</p>
                  <p style={styles.value}>{job.interview_type ?? "—"}</p>
                </div>
                <div>
                  <p style={styles.label}>Created</p>
                  <p style={styles.value}>{formatDate(job.created_at)}</p>
                </div>
                <div>
                  <p style={styles.label}>Updated</p>
                  <p style={styles.value}>{formatDate(job.updated_at)}</p>
                </div>
              </div>
              <div style={{ marginTop: "1.25rem" }}>
                <p style={styles.label}>Description</p>
                <p style={styles.value}>{job.description ?? "No description provided."}</p>
              </div>
            </div>

            {req && (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Parsed Requirements</h2>
                {req.min_years_experience != null && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <p style={styles.label}>Minimum years of experience</p>
                    <p style={styles.value}>{req.min_years_experience}</p>
                  </div>
                )}
                {req.education_requirements && req.education_requirements.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <p style={styles.label}>Education</p>
                    <ul style={styles.list}>
                      {req.education_requirements.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {req.required_skills && req.required_skills.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <p style={styles.label}>Required skills</p>
                    <ul style={styles.list}>
                      {req.required_skills.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {req.preferred_skills && req.preferred_skills.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <p style={styles.label}>Preferred skills</p>
                    <ul style={styles.list}>
                      {req.preferred_skills.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {req.key_responsibilities && req.key_responsibilities.length > 0 && (
                  <div>
                    <p style={styles.label}>Key responsibilities</p>
                    <ul style={styles.list}>
                      {req.key_responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={styles.actions}>
              <button style={styles.editButton} onClick={() => router.push(`/job/edit/${jobId}`)}>
                Edit
              </button>
              <button style={styles.applyButton} onClick={() => router.push(`/create_interview?job_id=${jobId}`)}>
                Create Interview
              </button>
            </div>
          </>
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
  backButton: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    marginBottom: "1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  title: { margin: 0, fontSize: "2rem", color: "#1a1a2e" },
  subtitle: { margin: "0.35rem 0 0", color: "#6c757d", fontSize: "0.95rem" },
  error: { color: "#dc3545", fontSize: "0.9rem", marginBottom: "1rem" },
  muted: { color: "#6c757d", fontSize: "0.95rem" },
  badges: { display: "flex", gap: "0.5rem", flexShrink: 0 },
  badge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "0.3rem 0.8rem",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  sectionTitle: { margin: "0 0 1rem", fontSize: "1.2rem", color: "#1a1a2e" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "1rem",
  },
  label: { margin: 0, fontSize: "0.8rem", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em" },
  value: { margin: "0.25rem 0 0", fontSize: "0.95rem", color: "#1a1a2e", lineHeight: 1.6 },
  list: { margin: "0.4rem 0 0", paddingLeft: "1.25rem", color: "#1a1a2e", fontSize: "0.95rem", lineHeight: 1.6 },
  applyButton: {
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  actions: { display: "flex", gap: "0.75rem" },
  editButton: {
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    background: "#fff",
    color: "#333",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
