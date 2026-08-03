"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface InterviewTemplate {
  id: string;
  name: string | null;
  interview_type: string | null;
  interview_type_name: string | null;
  duration_minutes: number | null;
  is_global: boolean;
  organization_id: string | null;
  organization_name: string | null;
  created_at: string;
  updated_at: string;
}

function groupTemplatesByScope(
  templates: InterviewTemplate[]
): { scopeName: string; templates: InterviewTemplate[] }[] {
  const groups = new Map<string, InterviewTemplate[]>();
  for (const template of templates) {
    const name = template.is_global ? "Global" : template.organization_name ?? "Unaffiliated";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(template);
  }
  return Array.from(groups.entries()).map(([scopeName, templates]) => ({ scopeName, templates }));
}

export default function TemplatesPage() {
  const ready = useAuthGuard();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    fetch(`${API_URL}/api/templates`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch templates");
        return res.json();
      })
      .then(setTemplates)
      .catch(() => setError("Could not load templates. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Interview Templates</h1>
            <p style={styles.subtitle}>{loading ? "Loading…" : `${templates.length} templates available`}</p>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {loading && !error && <p style={styles.muted}>Loading templates…</p>}

        {groupTemplatesByScope(templates).map((group) => (
          <section key={group.scopeName} style={styles.orgSection}>
            <h2 style={styles.orgTitle}>{group.scopeName}</h2>
            <div style={styles.grid}>
              {group.templates.map((template) => (
                <div key={template.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.templateName}>{template.name ?? "Untitled"}</h3>
                    {template.is_global && <span style={styles.badge}>Global</span>}
                  </div>
                  <p style={styles.description}>
                    {template.interview_type_name ?? "No interview type set"}
                  </p>
                  <p style={styles.meta}>
                    {template.duration_minutes ? `${template.duration_minutes} minutes` : "Duration not set"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {!loading && !error && templates.length === 0 && (
          <p style={styles.muted}>No templates available.</p>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  title: { margin: 0, fontSize: "2rem", color: "#1a1a2e" },
  subtitle: { margin: "0.35rem 0 0", color: "#6c757d", fontSize: "0.95rem" },
  error: { color: "#dc3545", fontSize: "0.9rem", marginBottom: "1rem" },
  muted: { color: "#6c757d", fontSize: "0.95rem" },
  orgSection: { marginBottom: "2rem" },
  orgTitle: {
    margin: "0 0 1rem",
    fontSize: "1.25rem",
    color: "#1a1a2e",
    fontWeight: 700,
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #e9ecef",
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
    gap: "0.5rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  templateName: { margin: 0, fontSize: "1.1rem", color: "#1a1a2e", fontWeight: 600 },
  badge: {
    flexShrink: 0,
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    background: "#ede9fe",
    color: "#4f46e5",
  },
  description: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#495057",
    lineHeight: 1.6,
  },
  meta: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#6c757d",
  },
};
