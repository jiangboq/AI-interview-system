from datetime import datetime
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_auth
from service import jobs as jobs_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"], dependencies=[Depends(require_auth)])


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
    organization_id: str | None
    organization_name: str | None


class CreateJobRequest(BaseModel):
    title: str
    description: str
    level: JobLevel
    organization_id: str


class JobDetail(BaseModel):
    id: str
    title: str | None
    description: str | None
    level: str | None
    interview_type: str | None
    status: str | None
    organization_id: str | None
    organization_name: str | None
    parsed_requirements: dict | None
    created_at: datetime
    updated_at: datetime


@router.get("", response_model=list[Job])
def list_jobs():
    try:
        return jobs_service.get_all_jobs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Job, status_code=201)
def create_job(req: CreateJobRequest):
    try:
        return jobs_service.create_job(req.title, req.description, req.level.value, req.organization_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=JobDetail)
def get_job(job_id: str):
    job = jobs_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
