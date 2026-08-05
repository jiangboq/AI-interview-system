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
