import psycopg2.extras

from db import get_db


def fetch_user_by_username(username: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, username, password_hash, role FROM users WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def fetch_all_users() -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, name, email, username, role, created_at FROM users ORDER BY created_at DESC"
            )
            return [dict(row) for row in cur.fetchall()]
