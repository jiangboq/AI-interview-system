from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from service import jobs as jobs_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobLevel(str, Enum):
    junior = "junior"
    mid = "mid"
    senior = "senior"
    staff = "staff"


class Job(BaseModel):
    id: str
    title: str | None
    description: str | None
    level: str | None


class CreateJobRequest(BaseModel):
    title: str
    description: str
    level: JobLevel


@router.get("", response_model=list[Job])
def list_jobs():
    try:
        return jobs_service.get_all_jobs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Job, status_code=201)
def create_job(req: CreateJobRequest):
    try:
        return jobs_service.create_job(req.title, req.description, req.level.value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
