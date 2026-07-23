import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from deps import get_org_ids, require_auth
from pagination import Page, PageParams
from service import interviews as interviews_service
from service import jobs as jobs_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


class InterviewRow(BaseModel):
    id: str
    candidate_name: str | None
    job_id: str | None
    job_title: str | None
    status: str | None
    created_at: str


class CreateInterviewRequest(BaseModel):
    candidate_id: str
    job_id: str
    expected_duration: int | None = None


class Interview(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    status: str
    created_at: str
    invite_token: str
    access_code: str
    expected_duration: int | None = None


class InterviewDetail(BaseModel):
    id: str
    status: str | None
    candidate_name: str | None
    job_title: str | None
    job_level: str | None
    started_at: str | None
    ended_at: str | None
    final_score: float | None
    recommendation: str | None
    summary: str | None
    created_at: str


class InterviewPublicInfo(BaseModel):
    id: str
    job_title: str | None
    job_level: str | None
    candidate_name: str | None
    status: str | None


class CandidateConfirmRequest(BaseModel):
    email: str
    code: str


class DimensionScore(BaseModel):
    dimension_name: str
    score: float
    evidence: list[str]
    rationale: str


class ScoreCardResponse(BaseModel):
    id: str
    interview_id: str
    overall_score: float
    recommendation: str
    strengths: list[str]
    concerns: list[str]
    dimensions: list[DimensionScore]
    created_at: str


class ResumeMatchResponse(BaseModel):
    overall_score: float
    recommendation: str
    matched_skills: list[str]
    missing_skills: list[str]
    summary: str


@router.get("", response_model=Page[InterviewRow])
def list_interviews(page_params: PageParams = Depends(), org_ids: list[str] | None = Depends(get_org_ids)):
    try:
        items, total = interviews_service.get_all_interviews(page_params.limit, page_params.offset, org_ids)
        return Page.create(items, total, page_params.page, page_params.page_size)
    except Exception as e:
        logger.exception("Failed to list interviews")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Interview, status_code=201)
def create_interview(
    req: CreateInterviewRequest, background_tasks: BackgroundTasks, org_ids: list[str] | None = Depends(get_org_ids)
):
    if not jobs_service.get_job(req.job_id, org_ids):
        raise HTTPException(status_code=403, detail="Not authorized for this job's organization")
    try:
        interview = interviews_service.create_interview(req.candidate_id, req.job_id, req.expected_duration)
    except Exception as e:
        logger.exception("Failed to create interview for candidate %s / job %s", req.candidate_id, req.job_id)
        raise HTTPException(status_code=500, detail=str(e))
    background_tasks.add_task(interviews_service.evaluate_resume_match, req.candidate_id, req.job_id)
    return interview


@router.get("/invite/{token}", response_model=InterviewPublicInfo)
def get_interview_by_token(token: str):
    interview = interviews_service.get_interview_by_token(token)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.post("/invite/{token}/confirm")
def confirm_candidate_email(token: str, req: CandidateConfirmRequest):
    interview = interviews_service.get_interview_by_token(token)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if req.code != interview.get("access_code"):
        raise HTTPException(status_code=400, detail="Invalid access code")
    return {"message": "Email confirmed", "interview_id": interview["id"]}


@router.post("/{interview_id}/end", status_code=202)
def end_interview(interview_id: str, background_tasks: BackgroundTasks):
    interviews_service.end_interview(interview_id)
    background_tasks.add_task(interviews_service.score_interview, interview_id)
    return {"message": "Interview ended, scoring in progress", "interview_id": interview_id}


@router.get("/{interview_id}/resume")
def get_interview_resume(interview_id: str):
    resume = interviews_service.get_interview_resume(interview_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.get("/{interview_id}", response_model=InterviewDetail)
def get_interview_detail(interview_id: str, org_ids: list[str] | None = Depends(get_org_ids)):
    interview = interviews_service.get_interview_detail(interview_id, org_ids)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.get("/{interview_id}/scorecard", response_model=ScoreCardResponse)
def get_scorecard(interview_id: str, org_ids: list[str] | None = Depends(get_org_ids)):
    scorecard = interviews_service.get_scorecard(interview_id, org_ids)
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    return scorecard


@router.get("/{interview_id}/resume-match", response_model=ResumeMatchResponse)
def get_resume_match(interview_id: str, org_ids: list[str] | None = Depends(get_org_ids)):
    match = interviews_service.get_resume_match(interview_id, org_ids)
    if not match:
        raise HTTPException(status_code=404, detail="Resume match not found")
    return match
