import psycopg2.extras

from db import get_db


def fetch_all_candidates() -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, full_name, email FROM candidates ORDER BY created_at DESC"
            )
            return [dict(row) for row in cur.fetchall()]


def insert_candidate(full_name: str, email: str) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO candidates (full_name, email)
                VALUES (%s, %s)
                RETURNING id::text, full_name, email
                """,
                (full_name, email),
            )
            conn.commit()
            return dict(cur.fetchone())
