"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clearToken, authHeaders } from "@/lib/auth";
import { useAuthGuard } from "@/lib/useAuthGuard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Candidate {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Job {
  id: string;
  title: string | null;
  level: string | null;
}

interface InterviewSession {
  session_id: string;
  invite_token: string;
  access_code: string;
  candidate_name: string;
  position: string;
}

export default function CreateInterviewPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [candidateQuery, setCandidateQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [positionQuery, setPositionQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const candidateDropdownRef = useRef<HTMLDivElement>(null);
  const jobDropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (candidateDropdownRef.current && !candidateDropdownRef.current.contains(e.target as Node)) {
        setShowCandidateDropdown(false);
      }
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(e.target as Node)) {
        setShowJobDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchCandidates() {
    if (candidates.length > 0) {
      setShowCandidateDropdown(true);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/candidates`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data: Candidate[] = await res.json();
      setCandidates(data);
      setShowCandidateDropdown(true);
    } catch {
      // silently fail — user can still type manually
    }
  }

  function selectCandidate(c: Candidate) {
    setSelectedCandidate(c);
    setCandidateQuery(c.full_name ?? "");
    setShowCandidateDropdown(false);
  }

  const filteredCandidates = candidateQuery
    ? candidates.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(candidateQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(candidateQuery.toLowerCase())
      )
    : candidates;

  async function fetchJobs() {
    if (jobs.length > 0) {
      setShowJobDropdown(true);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/jobs`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data: Job[] = await res.json();
      setJobs(data);
      setShowJobDropdown(true);
    } catch {
      // silently fail — user can still type manually
    }
  }

  function selectJob(j: Job) {
    setSelectedJob(j);
    setPositionQuery(j.title ?? "");
    setShowJobDropdown(false);
  }

  const filteredJobs = positionQuery
    ? jobs.filter((j) => j.title?.toLowerCase().includes(positionQuery.toLowerCase()))
    : jobs;

  async function startInterview() {
    if (!selectedCandidate || !selectedJob) {
      setError("Please select a candidate and a position.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          job_id: selectedJob.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Failed to create interview");
      }
      const data = await res.json();
      setSession({
        session_id: data.id,
        invite_token: data.invite_token,
        access_code: data.access_code,
        candidate_name: selectedCandidate.full_name ?? "",
        position: selectedJob.title ?? "",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSession(null);
    setCandidateQuery("");
    setSelectedCandidate(null);
    setPositionQuery("");
    setSelectedJob(null);
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Create Interview</h1>
            <p style={styles.subtitle}>AI Interview System</p>
          </div>
          <button style={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>

        {!session ? (
          <div style={styles.form}>
            <label style={styles.label}>Candidate</label>
            <div style={styles.dropdownWrapper} ref={candidateDropdownRef}>
              <input
                style={styles.input}
                placeholder="Search by name or email…"
                value={candidateQuery}
                onFocus={fetchCandidates}
                onChange={(e) => {
                  setCandidateQuery(e.target.value);
                  setSelectedCandidate(null);
                  setShowCandidateDropdown(true);
                }}
              />
              {showCandidateDropdown && (
                <div style={styles.dropdown}>
                  {filteredCandidates.length === 0 ? (
                    <div style={styles.dropdownEmpty}>No candidates found</div>
                  ) : (
                    filteredCandidates.map((c) => (
                      <div
                        key={c.id}
                        style={styles.dropdownItem}
                        onMouseDown={() => selectCandidate(c)}
                      >
                        <span style={styles.dropdownName}>{c.full_name ?? "—"}</span>
                        <span style={styles.dropdownEmail}>{c.email ?? ""}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <label style={styles.label}>Position</label>
            <div style={styles.dropdownWrapper} ref={jobDropdownRef}>
              <input
                style={styles.input}
                placeholder="Search by job title…"
                value={positionQuery}
                onFocus={fetchJobs}
                onChange={(e) => {
                  setPositionQuery(e.target.value);
                  setSelectedJob(null);
                  setShowJobDropdown(true);
                }}
              />
              {showJobDropdown && (
                <div style={styles.dropdown}>
                  {filteredJobs.length === 0 ? (
                    <div style={styles.dropdownEmpty}>No positions found</div>
                  ) : (
                    filteredJobs.map((j) => (
                      <div
                        key={j.id}
                        style={styles.dropdownItem}
                        onMouseDown={() => selectJob(j)}
                      >
                        <span style={styles.dropdownName}>{j.title ?? "—"}</span>
                        {j.level && (
                          <span style={styles.dropdownEmail}>
                            {j.level.charAt(0).toUpperCase() + j.level.slice(1)}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} onClick={startInterview} disabled={loading}>
              {loading ? "Creating…" : "Create Interview"}
            </button>
          </div>
        ) : (
          <div style={styles.sessionBox}>
            <div style={styles.badge}>Interview Created</div>
            <div style={styles.meta}>
              <span><strong>Candidate:</strong> {session.candidate_name}</span>
              <span><strong>Role:</strong> {session.position}</span>
            </div>
            <div>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "0.875rem", color: "#333" }}>
                Candidate invite link
              </p>
              <div style={styles.linkBox}>
                <span style={styles.linkText}>
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/interview/${session.invite_token}`
                    : `/interview/${session.invite_token}`}
                </span>
                <button
                  style={styles.copyButton}
                  onClick={() => {
                    const link = `${window.location.origin}/interview/${session.invite_token}`;
                    navigator.clipboard.writeText(link).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "0.875rem", color: "#333" }}>
                Access code
              </p>
              <div style={styles.codeBox}>
                <span style={styles.codeText}>{session.access_code}</span>
              </div>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.8rem", color: "#6c757d" }}>
                Share this code with the candidate separately. They will need it to enter the interview.
              </p>
            </div>
            <p style={styles.successNote}>
              Share the link and access code with the candidate. They must enter their email and the code to proceed.
            </p>
            <button style={{ ...styles.button, background: "#6c757d" }} onClick={reset}>
              Create Another
            </button>
          </div>
        )}
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
    marginBottom: "1.5rem",
  },
  title: { margin: 0, fontSize: "1.75rem", color: "#1a1a2e" },
  subtitle: { margin: "0.25rem 0 0", color: "#6c757d", fontSize: "0.9rem" },
  logoutButton: {
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
  dropdownWrapper: { position: "relative" },
  input: {
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    fontSize: "1rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    zIndex: 10,
    maxHeight: "220px",
    overflowY: "auto",
  },
  dropdownItem: {
    display: "flex",
    flexDirection: "column",
    padding: "0.65rem 0.85rem",
    cursor: "pointer",
    borderBottom: "1px solid #f1f3f5",
  },
  dropdownName: { fontSize: "0.9rem", color: "#1a1a2e", fontWeight: 500 },
  dropdownEmail: { fontSize: "0.8rem", color: "#6c757d", marginTop: "0.1rem" },
  dropdownEmpty: { padding: "0.75rem 0.85rem", color: "#6c757d", fontSize: "0.9rem" },
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
  error: { color: "#dc3545", fontSize: "0.875rem", margin: 0 },
  sessionBox: { display: "flex", flexDirection: "column", gap: "1rem" },
  badge: {
    display: "inline-block",
    background: "#e0e7ff",
    color: "#4f46e5",
    borderRadius: "999px",
    padding: "0.25rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    alignSelf: "flex-start",
  },
  successNote: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#495057",
    background: "#f8f9fa",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
  },
  meta: {
    display: "flex",
    gap: "1.5rem",
    fontSize: "0.875rem",
    color: "#495057",
  },
  linkBox: {
    display: "flex",
    alignItems: "center",
    background: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    padding: "0.6rem 0.85rem",
    gap: "0.75rem",
  },
  linkText: {
    flex: 1,
    fontSize: "0.8rem",
    color: "#495057",
    wordBreak: "break-all" as const,
    fontFamily: "monospace",
  },
  copyButton: {
    flexShrink: 0,
    padding: "0.3rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #4f46e5",
    background: "#fff",
    color: "#4f46e5",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  codeBox: {
    display: "inline-flex",
    alignItems: "center",
    background: "#f0f4ff",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
  },
  codeText: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#4f46e5",
    fontFamily: "monospace",
    letterSpacing: "0.2em",
  },
};
