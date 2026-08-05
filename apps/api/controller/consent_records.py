import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_candidate
from service import consent_records as consent_records_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/consent-records", tags=["consent-records"], dependencies=[Depends(require_candidate)])


class ConsentRecord(BaseModel):
    id: str
    consent: str
    version: str
    created_at: str


@router.get("/{version}", response_model=ConsentRecord)
def get_consent_record(version: str):
    consent_record = consent_records_service.get_consent_record(version)
    if not consent_record:
        raise HTTPException(status_code=404, detail="Consent record not found")
    return consent_record
