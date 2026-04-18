"use client";

import { useRouter } from "next/navigation";

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  Junior: { bg: "#d1fae5", text: "#065f46" },
  Mid: { bg: "#dbeafe", text: "#1e40af" },
  Senior: { bg: "#ede9fe", text: "#4f46e5" },
  Lead: { bg: "#fee2e2", text: "#991b1b" },
};

interface Job {
  id: number;
  title: string;
  description: string;
  level: "Junior" | "Mid" | "Senior" | "Lead";
}

const JOBS: Job[] = [
  {
    id: 1,
    title: "Frontend Engineer",
    description:
      "Build and maintain responsive web UIs using React and TypeScript. Collaborate closely with designers and backend engineers.",
    level: "Mid",
  },
  {
    id: 2,
    title: "Backend Engineer",
    description:
      "Design and implement scalable REST APIs in Python. Own the data layer and work with distributed systems.",
    level: "Senior",
  },
  {
    id: 3,
    title: "ML Engineer",
    description:
      "Develop and productionize machine learning models. Integrate LLM-based features into our interview pipeline.",
    level: "Senior",
  },
  {
    id: 4,
    title: "DevOps Engineer",
    description:
      "Manage CI/CD pipelines, Kubernetes clusters, and cloud infrastructure on AWS. Improve developer experience.",
    level: "Mid",
  },
  {
    id: 5,
    title: "Software Engineer",
    description:
      "Entry-level role for full-stack development. Great opportunity to learn across the stack and ship real features.",
    level: "Junior",
  },
  {
    id: 6,
    title: "Engineering Manager",
    description:
      "Lead a cross-functional team of 6–8 engineers. Drive roadmap planning, hiring, and technical excellence.",
    level: "Lead",
  },
];

export default function JobsPage() {
  const router = useRouter();

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Open Positions</h1>
            <p style={styles.subtitle}>{JOBS.length} roles available</p>
          </div>
          <button style={styles.createButton} onClick={() => router.push("/create_job")}>
            Create a Job
          </button>
        </div>

        <div style={styles.grid}>
          {JOBS.map((job) => {
            const badge = LEVEL_COLORS[job.level];
            return (
              <div key={job.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.jobTitle}>{job.title}</h2>
                  <span
                    style={{
                      ...styles.badge,
                      background: badge.bg,
                      color: badge.text,
                    }}
                  >
                    {job.level}
                  </span>
                </div>
                <p style={styles.description}>{job.description}</p>
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
  title: {
    margin: 0,
    fontSize: "2rem",
    color: "#1a1a2e",
  },
  subtitle: {
    margin: "0.35rem 0 0",
    color: "#6c757d",
    fontSize: "0.95rem",
  },
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
  jobTitle: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#1a1a2e",
    fontWeight: 600,
  },
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
