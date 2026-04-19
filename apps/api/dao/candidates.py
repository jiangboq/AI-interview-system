import psycopg2.extras

from db import get_db


def fetch_all_candidates() -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, full_name, email FROM candidates ORDER BY created_at DESC"
            )
            return [dict(row) for row in cur.fetchall()]
