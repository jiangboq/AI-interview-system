import psycopg2.extras

from db import get_db


def fetch_match(candidate_id: str, job_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id::text, candidate_id::text, job_id::text, resume_blob_id::text,
                       overall_score, recommendation, matched_skills, missing_skills,
                       summary, model, created_at, updated_at
                FROM resume_job_matches
                WHERE candidate_id = %s AND job_id = %s
                """,
                (candidate_id, job_id),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def upsert_match(
    candidate_id: str,
    job_id: str,
    resume_blob_id: str,
    overall_score: float,
    recommendation: str,
    matched_skills: list[str],
    missing_skills: list[str],
    summary: str,
    model: str,
) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO resume_job_matches (
                    candidate_id, job_id, resume_blob_id, overall_score, recommendation,
                    matched_skills, missing_skills, summary, model
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (candidate_id, job_id) DO UPDATE SET
                    resume_blob_id = EXCLUDED.resume_blob_id,
                    overall_score = EXCLUDED.overall_score,
                    recommendation = EXCLUDED.recommendation,
                    matched_skills = EXCLUDED.matched_skills,
                    missing_skills = EXCLUDED.missing_skills,
                    summary = EXCLUDED.summary,
                    model = EXCLUDED.model,
                    updated_at = NOW()
                RETURNING id::text, candidate_id::text, job_id::text, resume_blob_id::text,
                          overall_score, recommendation, matched_skills, missing_skills,
                          summary, model, created_at, updated_at
                """,
                (
                    candidate_id,
                    job_id,
                    resume_blob_id,
                    overall_score,
                    recommendation,
                    matched_skills,
                    missing_skills,
                    summary,
                    model,
                ),
            )
            conn.commit()
            return dict(cur.fetchone())
