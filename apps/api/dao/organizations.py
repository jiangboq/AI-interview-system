import psycopg2.extras

from db import get_db
from pagination import paginate_rows


def fetch_all_organizations(limit: int, offset: int) -> tuple[list[dict], int]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id::text, name, created_at, COUNT(*) OVER() AS total_count
                FROM organizations
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (limit, offset),
            )
            return paginate_rows([dict(row) for row in cur.fetchall()])


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
