from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_auth
from service import candidates as candidates_service

router = APIRouter(prefix="/api/candidates", tags=["candidates"], dependencies=[Depends(require_auth)])


class Candidate(BaseModel):
    id: str
    full_name: str | None
    email: str | None
    resume_url: str | None


class CreateCandidateRequest(BaseModel):
    full_name: str
    email: str
    resume_url: str | None = None


@router.get("", response_model=list[Candidate])
def list_candidates():
    try:
        return candidates_service.get_all_candidates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Candidate, status_code=201)
def create_candidate(req: CreateCandidateRequest):
    try:
        return candidates_service.create_candidate(req.full_name, req.email, req.resume_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
