import psycopg2.extras

from db import get_db


def update_blob_parsing(blob_id: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE resume_blobs SET status = 'parsing', updated_at = NOW() WHERE id = %s",
                (blob_id,),
            )
            conn.commit()


def update_blob_parsed(blob_id: str, parsed_data: dict) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE resume_blobs
                SET status = 'parsed', parsed_data = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (psycopg2.extras.Json(parsed_data), blob_id),
            )
            conn.commit()


def update_blob_parse_failed(blob_id: str, error: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE resume_blobs
                SET status = 'parse_failed', error = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (error, blob_id),
            )
            conn.commit()


def insert_resume_blob(file_url: str, file_ext: str) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO resume_blobs (file_url, file_ext, status)
                VALUES (%s, %s, 'pending')
                RETURNING id::text, file_url, file_ext, status, created_at
                """,
                (file_url, file_ext),
            )
            conn.commit()
            return dict(cur.fetchone())


def update_blob_processing(blob_id: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE resume_blobs SET status = 'processing', updated_at = NOW() WHERE id = %s",
                (blob_id,),
            )
            conn.commit()


def update_blob_done(blob_id: str, raw_text: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE resume_blobs
                SET status = 'done', raw_text = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (raw_text, blob_id),
            )
            conn.commit()


def update_blob_failed(blob_id: str, error: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE resume_blobs
                SET status = 'failed', error = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (error, blob_id),
            )
            conn.commit()


def fetch_latest_parsed_blob_for_interview(interview_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT rb.id::text, rb.file_url, rb.parsed_data, rb.created_at
                FROM resume_blobs rb
                JOIN interviews i ON i.candidate_id = rb.candidate_id
                WHERE i.id = %s AND rb.status = 'parsed'
                ORDER BY rb.created_at DESC
                LIMIT 1
                """,
                (interview_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def fetch_blob_by_id(blob_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id::text, file_url, file_ext, raw_text, parsed_data, status, error, created_at FROM resume_blobs WHERE id = %s",
                (blob_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None
