"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface InterviewSession {
  session_id: string;
  candidate_name: string;
  position: string;
  first_question: string;
}

export default function Home() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startInterview() {
    if (!name.trim() || !position.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_name: name, position }),
      });
      if (!res.ok) throw new Error("API request failed");
      const data: InterviewSession = await res.json();
      setSession(data);
    } catch {
      setError("Failed to connect to the API. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSession(null);
    setName("");
    setPosition("");
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>AI Interview System</h1>
        <p style={styles.subtitle}>Powered by FastAPI + Next.js</p>

        {!session ? (
          <div style={styles.form}>
            <label style={styles.label}>Your Name</label>
            <input
              style={styles.input}
              placeholder="e.g. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label style={styles.label}>Position</label>
            <input
              style={styles.input}
              placeholder="e.g. Senior Software Engineer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} onClick={startInterview} disabled={loading}>
              {loading ? "Starting…" : "Start Interview"}
            </button>
          </div>
        ) : (
          <div style={styles.sessionBox}>
            <div style={styles.badge}>Session: {session.session_id}</div>
            <h2 style={styles.questionLabel}>First Question</h2>
            <p style={styles.question}>{session.first_question}</p>
            <div style={styles.meta}>
              <span><strong>Candidate:</strong> {session.candidate_name}</span>
              <span><strong>Role:</strong> {session.position}</span>
            </div>
            <button style={{ ...styles.button, background: "#6c757d" }} onClick={reset}>
              Start New Session
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
  title: { margin: 0, fontSize: "1.75rem", color: "#1a1a2e" },
  subtitle: { margin: "0.25rem 0 2rem", color: "#6c757d", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  label: { fontWeight: 600, fontSize: "0.875rem", color: "#333" },
  input: {
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    fontSize: "1rem",
    outline: "none",
  },
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
  questionLabel: { margin: 0, fontSize: "1rem", color: "#6c757d" },
  question: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#1a1a2e",
    lineHeight: 1.6,
    background: "#f8f9fa",
    padding: "1rem",
    borderRadius: "8px",
  },
  meta: {
    display: "flex",
    gap: "1.5rem",
    fontSize: "0.875rem",
    color: "#495057",
  },
};
