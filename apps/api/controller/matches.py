from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_auth
from service import resume_match as resume_match_service

router = APIRouter(prefix="/api/jobs", tags=["matches"], dependencies=[Depends(require_auth)])


class MatchResponse(BaseModel):
    candidate_id: str
    job_id: str
    resume_blob_id: str
    overall_score: float
    recommendation: str
    matched_skills: list[str]
    missing_skills: list[str]
    summary: str


@router.get("/{job_id}/candidates/{candidate_id}/match", response_model=MatchResponse)
def get_match(job_id: str, candidate_id: str):
    try:
        match = resume_match_service.get_or_compute_match(candidate_id, job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not match:
        raise HTTPException(status_code=404, detail="Job or parsed resume not found")
    return match
