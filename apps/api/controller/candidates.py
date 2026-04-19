from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from service import candidates as candidates_service

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


class Candidate(BaseModel):
    id: str
    full_name: str | None
    email: str | None


@router.get("", response_model=list[Candidate])
def list_candidates():
    try:
        return candidates_service.get_all_candidates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
