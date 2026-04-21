from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_auth
from service import interviews as interviews_service

router = APIRouter(prefix="/api/interviews", tags=["interviews"], dependencies=[Depends(require_auth)])


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


@router.get("", response_model=list[InterviewRow])
def list_interviews():
    try:
        return interviews_service.get_all_interviews()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Interview, status_code=201)
def create_interview(req: CreateInterviewRequest):
    try:
        return interviews_service.create_interview(req.candidate_id, req.job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
