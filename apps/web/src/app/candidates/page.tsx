"use client";

import { useRouter } from "next/navigation";

interface Candidate {
  id: number;
  name: string;
  email: string;
}

const CANDIDATES: Candidate[] = [
  { id: 1, name: "Alice Johnson", email: "alice.johnson@example.com" },
  { id: 2, name: "Bob Martinez", email: "bob.martinez@example.com" },
  { id: 3, name: "Clara Liu", email: "clara.liu@example.com" },
  { id: 4, name: "David Kim", email: "david.kim@example.com" },
  { id: 5, name: "Eva Rossi", email: "eva.rossi@example.com" },
  { id: 6, name: "Frank Nguyen", email: "frank.nguyen@example.com" },
];

export default function CandidatesPage() {
  const router = useRouter();

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Candidates</h1>
            <p style={styles.subtitle}>{CANDIDATES.length} candidates total</p>
          </div>
          <button style={styles.createButton} onClick={() => router.push("/create_candidate")}>
            Add Candidate
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((c, i) => (
                <tr key={c.id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{c.name}</td>
                  <td style={{ ...styles.td, color: "#6c757d" }}>{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  subtitle: { margin: "0.35rem 0 0", color: "#6c757d", fontSize: "0.95rem" },
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
};
