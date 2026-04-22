"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";


const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function CreateCandidatePage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ full_name: name, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Failed to create candidate");
      }
      router.push("/candidates");
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
            <h1 style={styles.title}>Add Candidate</h1>
            <p style={styles.subtitle}>Create a new candidate profile</p>
          </div>
          <button style={styles.backButton} onClick={() => router.push("/candidates")}>
            ← Back
          </button>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Full Name</label>
          <input
            style={styles.input}
            placeholder="e.g. Jane Smith"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            placeholder="e.g. jane.smith@example.com"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
          />

          <label style={styles.label}>Resume <span style={styles.optional}>(optional)</span></label>
          <label style={{ ...styles.uploadBox, ...(resume ? styles.uploadBoxFilled : {}) }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            />
            {resume ? (
              <span style={styles.uploadFileName}>
                📄 {resume.name}
                <button
                  style={styles.uploadClear}
                  onClick={(e) => { e.preventDefault(); setResume(null); }}
                >
                  ✕
                </button>
              </span>
            ) : (
              <span style={styles.uploadPrompt}>Click to upload PDF, DOC, or DOCX</span>
            )}
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding…" : "Add Candidate"}
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
  optional: { fontWeight: 400, color: "#6c757d", fontSize: "0.8rem" },
  uploadBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.85rem",
    borderRadius: "8px",
    border: "2px dashed #dee2e6",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  uploadBoxFilled: { borderColor: "#4f46e5", background: "#f5f3ff" },
  uploadPrompt: { fontSize: "0.875rem", color: "#6c757d" },
  uploadFileName: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: "#4f46e5",
    fontWeight: 500,
  },
  uploadClear: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6c757d",
    fontSize: "0.8rem",
    padding: "0 0.15rem",
    lineHeight: 1,
  },
};
