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
                INSERT INTO jobs (title, description, level, organization_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id::text, title, description, level, organization_id::text
                """,
                (title, description, level, organization_id),
            )
            conn.commit()
            return dict(cur.fetchone())
