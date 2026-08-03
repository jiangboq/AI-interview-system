"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface TemplateStep {
  order: number;
  key: string;
  title: string;
  description?: string;
  duration_minutes?: number;
}

interface TemplateConfig {
  steps?: TemplateStep[];
}

interface TemplateDetail {
  id: string;
  name: string | null;
  interview_type: string | null;
  interview_type_name: string | null;
  duration_minutes: number | null;
  is_global: boolean;
  organization_id: string | null;
  organization_name: string | null;
  config_json: TemplateConfig | null;
  created_at: string;
  updated_at: string;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function TemplateDetailPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const params = useParams<{ template_id: string }>();
  const templateId = params.template_id;

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;

    fetch(`${API_URL}/api/templates/${templateId}`, { headers: authHeaders() })
      .then((res) => {
        if (res.status === 404) throw new Error("not_found");
        if (!res.ok) throw new Error("Failed to fetch template");
        return res.json();
      })
      .then(setTemplate)
      .catch((err) =>
        setError(
          err.message === "not_found"
            ? "Template not found."
            : "Could not load template. Make sure the backend is running."
        )
      )
      .finally(() => setLoading(false));
  }, [ready, templateId]);

  if (!ready) return null;

  const steps = (template?.config_json?.steps ?? []).slice().sort((a, b) => a.order - b.order);

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => router.push("/templates")}>
          ← Back to templates
        </button>

        {loading && <p style={styles.muted}>Loading…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && template && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>{template.name ?? "Untitled"}</h1>
                <p style={styles.subtitle}>
                  {template.is_global ? "Global template" : template.organization_name ?? "Unaffiliated"}
                </p>
              </div>
              {template.is_global && <span style={styles.badge}>Global</span>}
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Overview</h2>
              <div style={styles.grid}>
                <div>
                  <p style={styles.label}>Interview type</p>
                  <p style={styles.value}>{template.interview_type_name ?? "—"}</p>
                </div>
                <div>
                  <p style={styles.label}>Duration</p>
                  <p style={styles.value}>
                    {template.duration_minutes ? `${template.duration_minutes} minutes` : "—"}
                  </p>
                </div>
                <div>
                  <p style={styles.label}>Created</p>
                  <p style={styles.value}>{formatDate(template.created_at)}</p>
                </div>
                <div>
                  <p style={styles.label}>Updated</p>
                  <p style={styles.value}>{formatDate(template.updated_at)}</p>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Interview Flow</h2>
              {steps.length === 0 ? (
                <p style={styles.muted}>No flow steps defined for this template.</p>
              ) : (
                <div style={styles.flow}>
                  {steps.map((step, i) => (
                    <div key={step.key ?? i} style={styles.flowItem}>
                      <div style={styles.flowNode}>
                        <div style={styles.flowNodeHeader}>
                          <span style={styles.flowStepNumber}>{i + 1}</span>
                          <span style={styles.flowStepTitle}>{step.title}</span>
                        </div>
                        {step.description && (
                          <p style={styles.flowStepDescription}>{step.description}</p>
                        )}
                        {step.duration_minutes != null && (
                          <p style={styles.flowStepDuration}>{step.duration_minutes} min</p>
                        )}
                      </div>
                      {i < steps.length - 1 && <div style={styles.flowArrow}>→</div>}
                    </div>
                  ))}
                </div>
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
    flexShrink: 0,
    borderRadius: "999px",
    padding: "0.3rem 0.8rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    background: "#ede9fe",
    color: "#4f46e5",
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
  flow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: "0.5rem",
  },
  flowItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  flowNode: {
    width: "220px",
    background: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "10px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  flowNodeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  flowStepNumber: {
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  flowStepTitle: { fontSize: "0.95rem", fontWeight: 600, color: "#1a1a2e" },
  flowStepDescription: { margin: 0, fontSize: "0.85rem", color: "#495057", lineHeight: 1.5 },
  flowStepDuration: { margin: 0, fontSize: "0.8rem", color: "#6c757d", fontWeight: 600 },
  flowArrow: {
    fontSize: "1.25rem",
    color: "#adb5bd",
    flexShrink: 0,
  },
};
