from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_auth
from service import organizations as organizations_service

router = APIRouter(prefix="/api/organizations", tags=["organizations"], dependencies=[Depends(require_auth)])


class Organization(BaseModel):
    id: str
    name: str | None
    created_at: datetime | None


class CreateOrganizationRequest(BaseModel):
    name: str


@router.get("", response_model=list[Organization])
def list_organizations():
    try:
        return organizations_service.get_all_organizations()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Organization, status_code=201)
def create_organization(req: CreateOrganizationRequest):
    try:
        return organizations_service.create_organization(req.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
