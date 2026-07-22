from datetime import datetime
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import get_org_ids, require_auth
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


class UpdateJobRequest(BaseModel):
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
def list_jobs(org_ids: list[str] = Depends(get_org_ids)):
    try:
        return jobs_service.get_all_jobs(org_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Job, status_code=201)
def create_job(req: CreateJobRequest, org_ids: list[str] = Depends(get_org_ids)):
    if req.organization_id not in org_ids:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    try:
        return jobs_service.create_job(req.title, req.description, req.level.value, req.organization_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=JobDetail)
def get_job(job_id: str, org_ids: list[str] = Depends(get_org_ids)):
    job = jobs_service.get_job(job_id, org_ids)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}", response_model=Job)
def update_job(job_id: str, req: UpdateJobRequest, org_ids: list[str] = Depends(get_org_ids)):
    if req.organization_id not in org_ids:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    try:
        job = jobs_service.update_job(
            job_id, req.title, req.description, req.level.value, req.organization_id, org_ids
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
