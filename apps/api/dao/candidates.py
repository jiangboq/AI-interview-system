import psycopg2.extras

from db import get_db
from pagination import paginate_rows


def fetch_all_candidates(limit: int, offset: int) -> tuple[list[dict], int]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id::text, full_name, email, resume_url, COUNT(*) OVER() AS total_count
                FROM candidates
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (limit, offset),
            )
            return paginate_rows([dict(row) for row in cur.fetchall()])


def insert_candidate(full_name: str, email: str, resume_url: str | None = None) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO candidates (full_name, email, resume_url)
                VALUES (%s, %s, %s)
                RETURNING id::text, full_name, email, resume_url
                """,
                (full_name, email, resume_url),
            )
            conn.commit()
            candidate = dict(cur.fetchone())

            if resume_url:
                cur.execute(
                    """
                    UPDATE resume_blobs
                    SET candidate_id = %s, updated_at = NOW()
                    WHERE file_url = %s AND candidate_id IS NULL
                    """,
                    (candidate["id"], resume_url),
                )
                conn.commit()

            return candidate
