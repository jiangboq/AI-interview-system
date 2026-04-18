"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LEVELS = ["Junior", "Mid", "Senior", "Lead"] as const;
type Level = (typeof LEVELS)[number];

export default function CreateJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<Level>("Mid");

  function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    // TODO: wire up to API
    router.push("/jobs");
  }

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
            onChange={(e) => setTitle(e.target.value)}
          />

          <label style={styles.label}>Level</label>
          <select
            style={styles.input}
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, ...styles.textarea }}
            placeholder="Describe the role, responsibilities, and requirements…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button style={styles.button} onClick={handleSubmit}>
            Create Job
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
