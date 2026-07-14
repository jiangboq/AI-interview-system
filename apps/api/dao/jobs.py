import psycopg2.extras

from db import get_db


def fetch_all_jobs() -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT j.id::text, j.title, j.description, j.level,
                       j.organization_id::text, o.name AS organization_name
                FROM jobs j
                LEFT JOIN organizations o ON o.id = j.organization_id
                ORDER BY o.name NULLS LAST, j.created_at DESC
                """
            )
            return [dict(row) for row in cur.fetchall()]


def insert_job(title: str, description: str, level: str, organization_id: str) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                WITH inserted AS (
                    INSERT INTO jobs (title, description, level, organization_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, title, description, level, organization_id
                )
                SELECT inserted.id::text, inserted.title, inserted.description, inserted.level,
                       inserted.organization_id::text, o.name AS organization_name
                FROM inserted
                LEFT JOIN organizations o ON o.id = inserted.organization_id
                """,
                (title, description, level, organization_id),
            )
            conn.commit()
            return dict(cur.fetchone())


def fetch_job_by_id(job_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT j.id::text, j.title, j.description, j.level, j.interview_type, j.status,
                       j.organization_id::text, o.name AS organization_name,
                       j.parsed_requirements, j.created_at, j.updated_at
                FROM jobs j
                LEFT JOIN organizations o ON o.id = j.organization_id
                WHERE j.id = %s
                """,
                (job_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def update_job_parsed_requirements(job_id: str, parsed_requirements: dict) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE jobs
                SET parsed_requirements = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (psycopg2.extras.Json(parsed_requirements), job_id),
            )
            conn.commit()
