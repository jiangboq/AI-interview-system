import psycopg2.extras

from db import get_db


def fetch_scorecard(interview_id: str, org_ids: list[str] | None = None) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT s.id::text, s.interview_id::text, s.overall_score, s.recommendation,
                       s.strengths, s.concerns, s.raw_evaluation, s.created_at::text
                FROM scorecards s
                JOIN interviews i ON i.id = s.interview_id
                LEFT JOIN jobs   j ON j.id = i.job_id
                WHERE s.interview_id = %s AND (%s::uuid[] IS NULL OR j.organization_id = ANY(%s::uuid[]))
                """,
                (interview_id, org_ids, org_ids),
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
