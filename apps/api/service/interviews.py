import logging

from dao import interviews as interviews_dao
from dao import resume_blobs as resume_blobs_dao
from dao import scorecard_embeddings as scorecard_embeddings_dao
from dao import scorecards as scorecards_dao
from dao import transcripts as transcripts_dao
from service import embeddings as embeddings_service
from service import interview_scorer

logger = logging.getLogger("interviews")


def get_all_interviews() -> list[dict]:
    return interviews_dao.fetch_all_interviews()


def create_interview(candidate_id: str, job_id: str) -> dict:
    return interviews_dao.insert_interview(candidate_id, job_id)


def get_interview_by_token(token: str) -> dict | None:
    return interviews_dao.fetch_interview_by_token(token)


def get_interview_detail(interview_id: str) -> dict | None:
    return interviews_dao.fetch_interview_detail(interview_id)


def end_interview(interview_id: str) -> None:
    interviews_dao.mark_ended(interview_id)


def get_interview_resume(interview_id: str) -> dict | None:
    blob = resume_blobs_dao.fetch_latest_parsed_blob_for_interview(interview_id)
    return blob["parsed_data"] if blob else None


def get_scorecard(interview_id: str) -> dict | None:
    return scorecards_dao.fetch_scorecard(interview_id)


def _fetch_calibration_scorecards(turns: list[dict], job_id: str | None) -> list[dict]:
    if not job_id:
        return []
    try:
        transcript_text = " ".join(t["text"] for t in turns)
        embedding = embeddings_service.generate_embedding(transcript_text)
        return scorecard_embeddings_dao.fetch_similar_scorecards(job_id, embedding, k=5)
    except Exception:
        logger.exception("Failed to fetch calibration scorecards for job %s", job_id)
        return []


def _store_scorecard_embedding(
    scorecard_id: str, job_id: str | None, scorecard, interview: dict
) -> None:
    if not job_id:
        return
    try:
        text = embeddings_service.scorecard_text(
            scorecard, interview.get("job_title"), interview.get("job_level")
        )
        embedding = embeddings_service.generate_embedding(text)
        scorecard_embeddings_dao.insert_embedding(scorecard_id, job_id, embedding)
    except Exception:
        logger.exception("Failed to store scorecard embedding for scorecard %s", scorecard_id)


def score_interview(interview_id: str) -> None:
    if scorecards_dao.fetch_scorecard(interview_id):
        return

    transcript = transcripts_dao.fetch_transcript(interview_id)
    if not transcript or not transcript.get("turns"):
        logger.warning("No transcript found for interview %s, skipping scoring", interview_id)
        return

    interview = interviews_dao.fetch_interview(interview_id)
    if not interview:
        logger.warning("No interview record found for %s, skipping scoring", interview_id)
        return

    job_id = interview.get("job_id")
    past_scorecards = _fetch_calibration_scorecards(transcript["turns"], job_id)

    try:
        result = interview_scorer.score_interview(
            transcript["turns"],
            interview.get("job_title"),
            interview.get("job_level"),
            past_scorecards=past_scorecards,
        )
    except Exception:
        logger.exception("Failed to score interview %s", interview_id)
        return

    inserted = scorecards_dao.insert_scorecard(
        interview_id=interview_id,
        overall_score=result.overall_score,
        recommendation=result.recommendation,
        summary=result.summary,
        strengths=result.strengths,
        concerns=result.concerns,
        dimensions=[d.model_dump() for d in result.dimensions],
        raw_evaluation=result.model_dump(),
    )

    _store_scorecard_embedding(inserted["id"], job_id, result, interview)
