"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:         { bg: "#dbeafe", text: "#1e40af" },
  in_progress: { bg: "#fef9c3", text: "#854d0e" },
  completed:   { bg: "#d1fae5", text: "#065f46" },
  cancelled:   { bg: "#fee2e2", text: "#991b1b" },
};

interface InterviewDetail {
  id: string;
  status: string | null;
  candidate_name: string | null;
  job_title: string | null;
  job_level: string | null;
  started_at: string | null;
  ended_at: string | null;
  final_score: number | null;
  recommendation: string | null;
  summary: string | null;
  created_at: string;
}

interface DimensionScore {
  dimension_name: string;
  score: number;
  evidence: string[];
  rationale: string;
}

interface ScoreCard {
  id: string;
  interview_id: string;
  overall_score: number;
  recommendation: string;
  strengths: string[];
  concerns: string[];
  dimensions: DimensionScore[];
  created_at: string;
}

interface ResumeMatch {
  overall_score: number;
  recommendation: string;
  matched_skills: string[];
  missing_skills: string[];
  summary: string;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function InterviewDetailPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const params = useParams<{ interview_id: string }>();
  const interviewId = params.interview_id;

  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [scorecard, setScorecard] = useState<ScoreCard | null>(null);
  const [resumeMatch, setResumeMatch] = useState<ResumeMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;

    Promise.all([
      fetch(`${API_URL}/api/interviews/${interviewId}`, { headers: authHeaders() }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch interview");
        return res.json();
      }),
      fetch(`${API_URL}/api/interviews/${interviewId}/scorecard`, { headers: authHeaders() }).then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch scorecard");
        return res.json();
      }),
      fetch(`${API_URL}/api/interviews/${interviewId}/resume-match`, { headers: authHeaders() }).then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch resume match");
        return res.json();
      }),
    ])
      .then(([interviewData, scorecardData, resumeMatchData]) => {
        setInterview(interviewData);
        setScorecard(scorecardData);
        setResumeMatch(resumeMatchData);
      })
      .catch(() => setError("Could not load interview. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [ready, interviewId]);

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => router.push("/interviews")}>
          ← Back to interviews
        </button>

        {loading && <p style={styles.muted}>Loading…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && interview && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>{interview.candidate_name ?? "Unknown candidate"}</h1>
                <p style={styles.subtitle}>
                  {interview.job_title ?? "—"}
                  {interview.job_level ? ` · ${interview.job_level}` : ""}
                </p>
              </div>
              {(() => {
                const status = interview.status ?? "new";
                const badge = STATUS_COLORS[status] ?? { bg: "#e9ecef", text: "#495057" };
                return (
                  <span style={{ ...styles.badge, background: badge.bg, color: badge.text }}>
                    {status.replace("_", " ")}
                  </span>
                );
              })()}
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Overview</h2>
              <div style={styles.grid}>
                <div>
                  <p style={styles.label}>Created</p>
                  <p style={styles.value}>{formatDate(interview.created_at)}</p>
                </div>
                <div>
                  <p style={styles.label}>Started</p>
                  <p style={styles.value}>{formatDate(interview.started_at)}</p>
                </div>
                <div>
                  <p style={styles.label}>Ended</p>
                  <p style={styles.value}>{formatDate(interview.ended_at)}</p>
                </div>
                <div>
                  <p style={styles.label}>Final score</p>
                  <p style={styles.value}>{interview.final_score ?? "—"}</p>
                </div>
                <div>
                  <p style={styles.label}>Recommendation</p>
                  <p style={styles.value}>{interview.recommendation ?? "—"}</p>
                </div>
              </div>
              {interview.summary && (
                <div style={{ marginTop: "1.25rem" }}>
                  <p style={styles.label}>Summary</p>
                  <p style={styles.value}>{interview.summary}</p>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Scorecard</h2>
              {!scorecard && <p style={styles.muted}>No scorecard available yet.</p>}
              {scorecard && (
                <>
                  <div style={styles.grid}>
                    <div>
                      <p style={styles.label}>Overall score</p>
                      <p style={styles.value}>{scorecard.overall_score}</p>
                    </div>
                    <div>
                      <p style={styles.label}>Recommendation</p>
                      <p style={styles.value}>{scorecard.recommendation}</p>
                    </div>
                    <div>
                      <p style={styles.label}>Resume match</p>
                      <p style={styles.value}>
                        {resumeMatch ? `${resumeMatch.overall_score} · ${resumeMatch.recommendation}` : "—"}
                      </p>
                    </div>
                  </div>

                  {resumeMatch && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <p style={styles.label}>Resume match details</p>
                      <p style={styles.value}>{resumeMatch.summary}</p>
                      <div style={{ ...styles.grid, marginTop: "0.75rem" }}>
                        {resumeMatch.matched_skills.length > 0 && (
                          <div>
                            <p style={styles.label}>Matched skills</p>
                            <ul style={styles.list}>
                              {resumeMatch.matched_skills.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {resumeMatch.missing_skills.length > 0 && (
                          <div>
                            <p style={styles.label}>Missing skills</p>
                            <ul style={styles.list}>
                              {resumeMatch.missing_skills.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {scorecard.strengths.length > 0 && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <p style={styles.label}>Strengths</p>
                      <ul style={styles.list}>
                        {scorecard.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {scorecard.concerns.length > 0 && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <p style={styles.label}>Concerns</p>
                      <ul style={styles.list}>
                        {scorecard.concerns.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}

                  {scorecard.dimensions.length > 0 && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <p style={styles.label}>Dimensions</p>
                      <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Dimension</th>
                              <th style={styles.th}>Score</th>
                              <th style={styles.th}>Rationale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scorecard.dimensions.map((d, i) => (
                              <tr key={d.dimension_name} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                                <td style={styles.td}>{d.dimension_name}</td>
                                <td style={styles.td}>{d.score}</td>
                                <td style={styles.td}>{d.rationale}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
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
  value: { margin: "0.25rem 0 0", fontSize: "0.95rem", color: "#1a1a2e" },
  list: { margin: "0.4rem 0 0", paddingLeft: "1.25rem", color: "#1a1a2e", fontSize: "0.95rem" },
  tableWrapper: {
    marginTop: "0.5rem",
    border: "1px solid #e9ecef",
    borderRadius: "8px",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
  },
  th: {
    textAlign: "left",
    padding: "0.65rem 1rem",
    fontWeight: 600,
    fontSize: "0.75rem",
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e9ecef",
    background: "#fff",
  },
  td: {
    padding: "0.65rem 1rem",
    color: "#1a1a2e",
    borderBottom: "1px solid #f1f3f5",
  },
  rowEven: { background: "#fff" },
  rowOdd: { background: "#fafafa" },
};
