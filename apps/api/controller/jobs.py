from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from service import jobs as jobs_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class Job(BaseModel):
    id: str
    title: str | None
    description: str | None
    level: str | None


@router.get("", response_model=list[Job])
def list_jobs():
    try:
        return jobs_service.get_all_jobs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
