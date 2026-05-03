import os

from fastapi import APIRouter, HTTPException
from livekit.api import AccessToken, VideoGrants
from pydantic import BaseModel

router = APIRouter(prefix="/api/livekit", tags=["livekit"])


class TokenRequest(BaseModel):
    room_name: str
    participant_name: str
    metadata: str = ""


class TokenResponse(BaseModel):
    token: str
    url: str


@router.post("/token", response_model=TokenResponse)
def generate_token(req: TokenRequest) -> TokenResponse:
    api_key = os.getenv("LIVEKIT_API_KEY", "devkey")
    api_secret = os.getenv("LIVEKIT_API_SECRET", "devsecret")
    livekit_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")

    if not req.room_name or not req.participant_name:
        raise HTTPException(status_code=400, detail="room_name and participant_name are required")

    token = (
        AccessToken(api_key, api_secret)
        .with_identity(req.participant_name)
        .with_name(req.participant_name)
        .with_metadata(req.metadata)
        .with_grants(VideoGrants(room_join=True, room=req.room_name))
        .to_jwt()
    )

    return TokenResponse(token=token, url=livekit_url)
