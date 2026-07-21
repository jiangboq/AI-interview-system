import psycopg2.extras

from db import get_db
from pagination import paginate_rows


def fetch_user_by_username(username: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, username, password_hash, role FROM users WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def fetch_user_by_id(user_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, name, email, username, role, created_at FROM users WHERE id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def fetch_all_users(limit: int, offset: int) -> tuple[list[dict], int]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id::text, name, email, username, role, created_at, COUNT(*) OVER() AS total_count
                FROM users
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (limit, offset),
            )
            return paginate_rows([dict(row) for row in cur.fetchall()])


def insert_user(name: str, email: str, username: str, password_hash: str, role: str) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO users (name, email, username, password_hash, role)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id::text, name, email, username, role, created_at
                """,
                (name, email, username, password_hash, role),
            )
            conn.commit()
            return dict(cur.fetchone())
