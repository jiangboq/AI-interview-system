import psycopg2.extras

from db import get_db


def _vec(embedding: list[float]) -> str:
    return "[" + ",".join(map(str, embedding)) + "]"


def insert_embedding(scorecard_id: str, job_id: str, embedding: list[float]) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO scorecard_embeddings (scorecard_id, job_id, embedding)
                VALUES (%s, %s, %s::vector)
                """,
                (scorecard_id, job_id, _vec(embedding)),
            )
            conn.commit()


def fetch_similar_scorecards(job_id: str, embedding: list[float], k: int = 5) -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    s.overall_score,
                    s.recommendation,
                    s.raw_evaluation->>'summary' AS summary,
                    s.strengths,
                    s.concerns
                FROM scorecard_embeddings se
                JOIN scorecards s ON s.id = se.scorecard_id
                WHERE se.job_id = %s
                ORDER BY se.embedding <=> %s::vector
                LIMIT %s
                """,
                (job_id, _vec(embedding), k),
            )
            return [dict(row) for row in cur.fetchall()]
