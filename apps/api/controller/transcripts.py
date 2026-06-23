from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dao import transcripts as transcripts_dao
from deps import require_auth

router = APIRouter(prefix="/api/transcripts", tags=["transcripts"])


class TurnRequest(BaseModel):
    speaker: str
    text: str
    timestamp: str | None = None
    section: str | None = None


class TurnResponse(BaseModel):
    interview_id: str
    speaker: str
    text: str
    timestamp: str
    section: str | None = None


@router.post("/{interview_id}/turns", response_model=TurnResponse, status_code=201)
def append_turn(interview_id: str, req: TurnRequest):
    timestamp = req.timestamp or datetime.now(timezone.utc).isoformat()
    try:
        transcripts_dao.append_turn(interview_id, req.speaker, req.text, timestamp, req.section)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return TurnResponse(
        interview_id=interview_id, speaker=req.speaker, text=req.text, timestamp=timestamp, section=req.section
    )


@router.get("/{interview_id}", dependencies=[Depends(require_auth)])
def get_transcript(interview_id: str):
    doc = transcripts_dao.fetch_transcript(interview_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return doc
