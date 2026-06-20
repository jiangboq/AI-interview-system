import psycopg2.extras

from db import get_db


def fetch_scorecard(interview_id: str) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id::text, interview_id::text, overall_score, recommendation,
                       strengths, concerns, raw_evaluation, created_at::text
                FROM scorecards
                WHERE interview_id = %s
                """,
                (interview_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            scorecard = dict(row)

            cur.execute(
                """
                SELECT dimension_name, score, evidence, rationale
                FROM scorecard_dimensions
                WHERE scorecard_id = %s
                """,
                (scorecard["id"],),
            )
            scorecard["dimensions"] = [dict(r) for r in cur.fetchall()]
            return scorecard


def insert_scorecard(
    interview_id: str,
    overall_score: float,
    recommendation: str,
    summary: str,
    strengths: list[str],
    concerns: list[str],
    dimensions: list[dict],
    raw_evaluation: dict,
) -> dict:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO scorecards (interview_id, overall_score, recommendation, strengths, concerns, raw_evaluation)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id::text
                """,
                (
                    interview_id,
                    overall_score,
                    recommendation,
                    psycopg2.extras.Json(strengths),
                    psycopg2.extras.Json(concerns),
                    psycopg2.extras.Json(raw_evaluation),
                ),
            )
            scorecard_id = cur.fetchone()["id"]

            for dim in dimensions:
                cur.execute(
                    """
                    INSERT INTO scorecard_dimensions (scorecard_id, dimension_name, score, evidence, rationale)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        scorecard_id,
                        dim["name"],
                        dim["score"],
                        psycopg2.extras.Json(dim["evidence"]),
                        dim["rationale"],
                    ),
                )

            cur.execute(
                """
                UPDATE interviews
                SET final_score = %s, recommendation = %s, summary = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (overall_score, recommendation, summary, interview_id),
            )

            conn.commit()
            return {"id": scorecard_id, "interview_id": interview_id}
