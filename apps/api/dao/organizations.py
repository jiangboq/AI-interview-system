import psycopg2.extras

from db import get_db


def fetch_all_organizations() -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, name, created_at FROM organizations ORDER BY created_at DESC"
            )
            return [dict(row) for row in cur.fetchall()]


def insert_organization(name: str) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO organizations (name)
                VALUES (%s)
                RETURNING id::text, name, created_at
                """,
                (name,),
            )
            conn.commit()
            return dict(cur.fetchone())
