import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import get_org_ids, require_auth
from service import templates as templates_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/templates", tags=["templates"], dependencies=[Depends(require_auth)])


class InterviewTemplate(BaseModel):
    id: str
    name: str | None
    interview_type: str | None
    interview_type_name: str | None
    duration_minutes: int | None
    is_global: bool
    organization_id: str | None
    organization_name: str | None
    created_at: str
    updated_at: str


@router.get("", response_model=list[InterviewTemplate])
def list_templates(org_ids: list[str] | None = Depends(get_org_ids)):
    try:
        return templates_service.get_all_templates(org_ids)
    except Exception as e:
        logger.exception("Failed to list templates")
        raise HTTPException(status_code=500, detail=str(e))
