from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_auth
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


class InterviewPublicInfo(BaseModel):
    id: str
    job_title: str | None
    job_level: str | None
    candidate_name: str | None
    status: str | None


class CandidateEmailRequest(BaseModel):
    email: str


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
def confirm_candidate_email(token: str, req: CandidateEmailRequest):
    interview = interviews_service.get_interview_by_token(token)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    return {"message": "Email confirmed", "interview_id": interview["id"]}
