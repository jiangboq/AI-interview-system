import psycopg2.extras

from db import get_db


def fetch_consent_record_by_version(version: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id::text, consent, version, created_at::text
                FROM consent_records
                WHERE version = %s
                """,
                (version,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def insert_user_consent(interview_id: str, version: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO user_consents (candidate_id, consent_id, interview_id, agreed_at)
                SELECT i.candidate_id, cr.id, i.id, NOW()
                FROM interviews i
                JOIN consent_records cr ON cr.version = %s
                WHERE i.id = %s
                RETURNING id::text, candidate_id::text, consent_id::text, interview_id::text, agreed_at::text
                """,
                (version, interview_id),
            )
            row = cur.fetchone()
            conn.commit()
            return dict(row) if row else None
