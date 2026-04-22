import psycopg2.extras

from db import get_db


def fetch_all_interviews() -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    i.id::text,
                    c.full_name  AS candidate_name,
                    j.title      AS job_title,
                    i.status,
                    i.created_at::text
                FROM interviews i
                LEFT JOIN candidates c ON c.id = i.candidate_id
                LEFT JOIN jobs      j ON j.id = i.job_id
                ORDER BY i.created_at DESC
                """
            )
            return [dict(row) for row in cur.fetchall()]


def insert_interview(candidate_id: str, job_id: str) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO interviews (candidate_id, job_id, status)
                VALUES (%s, %s, 'new')
                RETURNING id::text, candidate_id::text, job_id::text, status, created_at::text
                """,
                (candidate_id, job_id),
            )
            conn.commit()
            return dict(cur.fetchone())
