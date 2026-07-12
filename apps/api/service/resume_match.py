from dao import jobs as jobs_dao
from dao import resume_blobs as resume_blobs_dao
from dao import resume_job_matches as matches_dao
from service.jd_parser import parse_job_requirements
from service.resume_matcher import score_match

_MATCHING_MODEL = "gpt-4.1-mini"


def get_or_compute_match(candidate_id: str, job_id: str) -> dict | None:
    job = jobs_dao.fetch_job_by_id(job_id)
    if not job:
        return None

    if not job["parsed_requirements"]:
        requirements = parse_job_requirements(job["description"] or "")
        jobs_dao.update_job_parsed_requirements(job_id, requirements.model_dump())
        job = jobs_dao.fetch_job_by_id(job_id)

    blob = resume_blobs_dao.fetch_latest_parsed_blob_for_candidate(candidate_id)
    if not blob:
        return None

    cached = matches_dao.fetch_match(candidate_id, job_id)
    if (
        cached
        and cached["resume_blob_id"] == blob["id"]
        and cached["updated_at"] >= job["updated_at"]
    ):
        return cached

    match = score_match(blob["parsed_data"], job["parsed_requirements"])
    return matches_dao.upsert_match(
        candidate_id=candidate_id,
        job_id=job_id,
        resume_blob_id=blob["id"],
        overall_score=match.overall_score,
        recommendation=match.recommendation,
        matched_skills=match.matched_skills,
        missing_skills=match.missing_skills,
        summary=match.summary,
        model=_MATCHING_MODEL,
    )
