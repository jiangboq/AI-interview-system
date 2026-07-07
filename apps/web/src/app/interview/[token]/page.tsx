"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, ControlBar } from "@livekit/components-react";
import "@livekit/components-styles";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface InterviewInfo {
  id: string;
  job_title: string | null;
  job_level: string | null;
  candidate_name: string | null;
  status: string | null;
}

type PageState = "loading" | "not_found" | "email_form" | "confirmed" | "starting" | "interviewing" | "error";

export default function CandidateInterviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [interview, setInterview] = useState<InterviewInfo | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [livekitToken, setLivekitToken] = useState("");
  const [livekitUrl, setLivekitUrl] = useState("");

  useEffect(() => {
    async function loadInterview() {
      try {
        const res = await fetch(`${API_URL}/api/interviews/invite/${token}`);
        if (res.status === 404) {
          setPageState("not_found");
          return;
        }
        if (!res.ok) throw new Error();
        const data: InterviewInfo = await res.json();
        setInterview(data);
        setPageState("email_form");
      } catch {
        setPageState("error");
      }
    }
    loadInterview();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!code || code.length !== 8) {
      setFormError("Please enter the 8-digit access code.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/interviews/invite/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Failed to confirm email");
      }
      setPageState("confirmed");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startInterview() {
    setPageState("starting");
    try {
      const res = await fetch(`${API_URL}/api/livekit/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_name: token,
          participant_name: email,
          metadata: token,
        }),
      });
      if (!res.ok) throw new Error("Failed to get interview token");
      const data = await res.json();
      setLivekitToken(data.token);
      setLivekitUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL ?? data.url);
      setPageState("interviewing");
    } catch {
      setFormError("Failed to start interview. Please try again.");
      setPageState("confirmed");
    }
  }

  if (pageState === "interviewing" && livekitToken) {
    return (
      <LiveKitRoom
        token={livekitToken}
        serverUrl={livekitUrl}
        audio={true}
        video={false}
        style={{ height: "100dvh" }}
      >
        <RoomAudioRenderer />
        <InterviewRoomUI jobTitle={interview?.job_title ?? "your interview"} />
      </LiveKitRoom>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <h2 style={styles.brand}>AI Interview System</h2>
        </div>

        {pageState === "loading" && (
          <p style={styles.hint}>Loading your interview…</p>
        )}

        {pageState === "not_found" && (
          <div style={styles.centeredMessage}>
            <p style={styles.errorHeading}>Link not found</p>
            <p style={styles.hint}>This interview link is invalid or has expired.</p>
          </div>
        )}

        {pageState === "error" && (
          <div style={styles.centeredMessage}>
            <p style={styles.errorHeading}>Something went wrong</p>
            <p style={styles.hint}>Please try refreshing the page.</p>
          </div>
        )}

        {pageState === "email_form" && interview && (
          <>
            <div style={styles.interviewMeta}>
              <p style={styles.roleLabel}>You have been invited to interview for</p>
              <h1 style={styles.jobTitle}>{interview.job_title ?? "a position"}</h1>
              {interview.job_level && (
                <span style={styles.levelBadge}>
                  {interview.job_level.charAt(0).toUpperCase() + interview.job_level.slice(1)}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label} htmlFor="email">
                Your email address
              </label>
              <input
                id="email"
                type="email"
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <label style={styles.label} htmlFor="code">
                Access code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={8}
                style={styles.input}
                placeholder="8-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              />
              {formError && <p style={styles.error}>{formError}</p>}
              <button type="submit" style={styles.button} disabled={submitting}>
                {submitting ? "Confirming…" : "Continue to Interview"}
              </button>
            </form>
          </>
        )}

        {(pageState === "confirmed" || pageState === "starting") && (
          <div style={styles.confirmedBox}>
            <div style={styles.checkmark}>✓</div>
            <h2 style={styles.confirmedHeading}>You&apos;re all set!</h2>
            <p style={styles.hint}>
              Your email has been confirmed. Click below when you are ready to begin.
            </p>
            {formError && <p style={styles.error}>{formError}</p>}
            <button
              style={pageState === "starting" ? { ...styles.button, opacity: 0.7, cursor: "not-allowed" } : styles.button}
              disabled={pageState === "starting"}
              onClick={startInterview}
            >
              {pageState === "starting" ? "Starting…" : "Start Interview"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function InterviewRoomUI({ jobTitle }: { jobTitle: string }) {
  return (
    <div style={roomStyles.container}>
      <div style={roomStyles.header}>
        <span style={roomStyles.brand}>AI Interview System</span>
        <span style={roomStyles.jobLabel}>{jobTitle}</span>
      </div>
      <div style={roomStyles.body}>
        <div style={roomStyles.agentAvatar}>
          <span style={roomStyles.avatarIcon}>AI</span>
        </div>
        <p style={roomStyles.statusText}>Interview in progress</p>
        <p style={roomStyles.subText}>Speak clearly — the AI interviewer is listening.</p>
      </div>
      <div style={roomStyles.footer}>
        <ControlBar variation="minimal" controls={{ microphone: true, camera: false, screenShare: false, leave: true }} />
      </div>
    </div>
  );
}

const roomStyles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    background: "#0f0f1a",
    color: "#fff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brand: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#9ca3af",
  },
  jobLabel: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#c7d2fe",
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.25rem",
  },
  agentAvatar: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#fff",
    boxShadow: "0 0 32px rgba(79,70,229,0.5)",
  },
  avatarIcon: {},
  statusText: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#f3f4f6",
  },
  subText: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#9ca3af",
  },
  footer: {
    padding: "1.5rem",
    display: "flex",
    justifyContent: "center",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
};

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
    borderRadius: "16px",
    boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "440px",
  },
  logoArea: {
    marginBottom: "1.5rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid #f1f3f5",
  },
  brand: {
    margin: 0,
    fontSize: "1rem",
    color: "#6c757d",
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  interviewMeta: {
    marginBottom: "2rem",
  },
  roleLabel: {
    margin: "0 0 0.5rem",
    fontSize: "0.875rem",
    color: "#6c757d",
  },
  jobTitle: {
    margin: "0 0 0.75rem",
    fontSize: "1.6rem",
    color: "#1a1a2e",
    fontWeight: 700,
  },
  levelBadge: {
    display: "inline-block",
    background: "#e0e7ff",
    color: "#4f46e5",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  label: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#333",
  },
  input: {
    padding: "0.7rem 0.9rem",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    fontSize: "1rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  button: {
    marginTop: "0.25rem",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    color: "#dc3545",
    fontSize: "0.875rem",
    margin: 0,
  },
  hint: {
    color: "#6c757d",
    fontSize: "0.9rem",
    textAlign: "center" as const,
  },
  centeredMessage: {
    textAlign: "center" as const,
    padding: "1rem 0",
  },
  errorHeading: {
    margin: "0 0 0.5rem",
    fontSize: "1.25rem",
    color: "#1a1a2e",
    fontWeight: 700,
  },
  confirmedBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem 0",
  },
  checkmark: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#d1fae5",
    color: "#059669",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  confirmedHeading: {
    margin: 0,
    fontSize: "1.5rem",
    color: "#1a1a2e",
  },
};
