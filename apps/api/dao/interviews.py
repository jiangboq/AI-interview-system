import secrets

import psycopg2.extras

from db import get_db
from pagination import paginate_rows


def _generate_access_code() -> str:
    return "".join([str(secrets.randbelow(10)) for _ in range(8)])


def fetch_all_interviews(limit: int, offset: int, org_ids: list[str]) -> tuple[list[dict], int]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    i.id::text,
                    c.full_name  AS candidate_name,
                    j.id::text   AS job_id,
                    j.title      AS job_title,
                    i.status,
                    i.created_at::text,
                    COUNT(*) OVER() AS total_count
                FROM interviews i
                LEFT JOIN candidates c ON c.id = i.candidate_id
                LEFT JOIN jobs      j ON j.id = i.job_id
                WHERE j.organization_id = ANY(%s::uuid[])
                ORDER BY i.created_at DESC
                LIMIT %s OFFSET %s
                """,
                (org_ids, limit, offset),
            )
            return paginate_rows([dict(row) for row in cur.fetchall()])


def insert_interview(candidate_id: str, job_id: str, expected_duration: int | None = None) -> dict:
    invite_token = secrets.token_urlsafe(32)
    access_code = _generate_access_code()
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO interviews (candidate_id, job_id, status, invite_token, access_code, expected_duration)
                VALUES (%s, %s, 'new', %s, %s, %s)
                RETURNING id::text, candidate_id::text, job_id::text, status, created_at::text, invite_token, access_code, expected_duration
                """,
                (candidate_id, job_id, invite_token, access_code, expected_duration),
            )
            conn.commit()
            return dict(cur.fetchone())


def fetch_interview(interview_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    i.id::text,
                    i.candidate_id::text,
                    i.job_id::text,
                    i.status,
                    c.full_name AS candidate_name,
                    j.title     AS job_title,
                    j.level     AS job_level
                FROM interviews i
                LEFT JOIN candidates c ON c.id = i.candidate_id
                LEFT JOIN jobs      j ON j.id = i.job_id
                WHERE i.id = %s
                """,
                (interview_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def fetch_interview_detail(interview_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    i.id::text,
                    i.status,
                    c.full_name   AS candidate_name,
                    j.title       AS job_title,
                    j.level       AS job_level,
                    i.started_at::text,
                    i.ended_at::text,
                    i.final_score,
                    i.recommendation,
                    i.summary,
                    i.created_at::text
                FROM interviews i
                LEFT JOIN candidates c ON c.id = i.candidate_id
                LEFT JOIN jobs      j ON j.id = i.job_id
                WHERE i.id = %s
                """,
                (interview_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def mark_ended(interview_id: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE interviews
                SET status = 'completed', ended_at = NOW(), updated_at = NOW()
                WHERE id = %s
                """,
                (interview_id,),
            )
            conn.commit()


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
