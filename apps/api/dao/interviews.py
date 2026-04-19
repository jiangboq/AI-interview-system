import psycopg2.extras

from db import get_db


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
