from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from deps import require_admin, require_auth
from service import interviews as interviews_service

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


class InterviewRow(BaseModel):
    id: str
    candidate_name: str | None
    job_title: str | None
    status: str | None
    created_at: str


class CreateInterviewRequest(BaseModel):
    candidate_id: str
    job_id: str


class Interview(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    status: str
    created_at: str
    invite_token: str
    access_code: str


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


@router.get("", response_model=list[InterviewRow], dependencies=[Depends(require_auth)])
def list_interviews():
    try:
        return interviews_service.get_all_interviews()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Interview, status_code=201, dependencies=[Depends(require_auth)])
def create_interview(req: CreateInterviewRequest):
    try:
        return interviews_service.create_interview(req.candidate_id, req.job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@router.get("/{interview_id}", response_model=InterviewDetail, dependencies=[Depends(require_admin)])
def get_interview_detail(interview_id: str):
    interview = interviews_service.get_interview_detail(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.get("/{interview_id}/scorecard", response_model=ScoreCardResponse, dependencies=[Depends(require_admin)])
def get_scorecard(interview_id: str):
    scorecard = interviews_service.get_scorecard(interview_id)
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    return scorecard
