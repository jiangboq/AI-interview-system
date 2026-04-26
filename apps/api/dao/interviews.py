import secrets

import psycopg2.extras

from db import get_db


def _generate_access_code() -> str:
    return "".join([str(secrets.randbelow(10)) for _ in range(8)])


def fetch_all_interviews() -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    i.id::text,
                    c.full_name  AS candidate_name,
                    j.title      AS job_title,
                    i.status,
                    i.created_at::text
                FROM interviews i
                LEFT JOIN candidates c ON c.id = i.candidate_id
                LEFT JOIN jobs      j ON j.id = i.job_id
                ORDER BY i.created_at DESC
                """
            )
            return [dict(row) for row in cur.fetchall()]


def insert_interview(candidate_id: str, job_id: str) -> dict:
    invite_token = secrets.token_urlsafe(32)
    access_code = _generate_access_code()
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO interviews (candidate_id, job_id, status, invite_token, access_code)
                VALUES (%s, %s, 'new', %s, %s)
                RETURNING id::text, candidate_id::text, job_id::text, status, created_at::text, invite_token, access_code
                """,
                (candidate_id, job_id, invite_token, access_code),
            )
            conn.commit()
            return dict(cur.fetchone())


def fetch_interview_by_token(token: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    i.id::text,
                    i.status,
                    i.access_code,
                    c.full_name  AS candidate_name,
                    j.title      AS job_title,
                    j.level      AS job_level
                FROM interviews i
                LEFT JOIN candidates c ON c.id = i.candidate_id
                LEFT JOIN jobs      j ON j.id = i.job_id
                WHERE i.invite_token = %s
                """,
                (token,),
            )
            row = cur.fetchone()
            return dict(row) if row else None
