import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from livekit import api as lkapi
from livekit.api import AccessToken, VideoGrants
from pydantic import BaseModel

logger = logging.getLogger(__name__)

load_dotenv(Path(__file__).resolve().parent / ".." / ".." / ".." / "configs" / "dev.env")

router = APIRouter(prefix="/api/livekit", tags=["livekit"])

AGENT_NAME = "interview-agent"


def _livekit_config() -> tuple[str, str, str, str]:
    api_key = os.getenv("LIVEKIT_API_KEY", "devkey")
    api_secret = os.getenv("LIVEKIT_API_SECRET", "devsecret")
    ws_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    public_url = os.getenv("LIVEKIT_URL_PUBLIC", ws_url)
    return api_key, api_secret, ws_url, public_url


class TokenRequest(BaseModel):
    room_name: str
    participant_name: str
    metadata: str = ""


class TokenResponse(BaseModel):
    token: str
    url: str


class STTConfig(BaseModel):
    model: str = "deepgram/nova-3"
    language: str = "multi"


class LLMConfig(BaseModel):
    model: str = "anthropic/claude-haiku-4-5-20251001"


class TTSConfig(BaseModel):
    model: str = "cartesia/sonic-3"
    voice: str = "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"


class SessionRequest(BaseModel):
    room_name: str
    stt: STTConfig = STTConfig()
    llm: LLMConfig = LLMConfig()
    tts: TTSConfig = TTSConfig()


class SessionResponse(BaseModel):
    room_name: str
    dispatched: bool


@router.post("/token", response_model=TokenResponse)
def generate_token(req: TokenRequest) -> TokenResponse:
    api_key, api_secret, _ws_url, public_url = _livekit_config()

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

    return TokenResponse(token=token, url=public_url)


@router.post("/session", response_model=SessionResponse)
async def ensure_session(req: SessionRequest) -> SessionResponse:
    api_key, api_secret, ws_url, _public_url = _livekit_config()
    http_url = ws_url.replace("wss://", "https://").replace("ws://", "http://")

    dispatched = False
    try:
        async with lkapi.LiveKitAPI(http_url, api_key, api_secret) as client:
            await client.room.create_room(
                lkapi.CreateRoomRequest(name=req.room_name)
            )
            logger.info("Room created or already exists: %s", req.room_name)

            try:
                list_resp = await client.agent_dispatch.list_dispatch(
                    lkapi.ListAgentDispatchRequest(room=req.room_name)
                )
                if list_resp.agent_dispatches:
                    logger.info("Agent already dispatched for room: %s", req.room_name)
                    return SessionResponse(room_name=req.room_name, dispatched=False)

                session_metadata = json.dumps({
                    "stt": req.stt.model_dump(),
                    "llm": req.llm.model_dump(),
                    "tts": req.tts.model_dump(),
                })
                await client.agent_dispatch.create_dispatch(
                    lkapi.CreateAgentDispatchRequest(
                        room=req.room_name,
                        agent_name=AGENT_NAME,
                        metadata=session_metadata,
                    )
                )
                dispatched = True
                logger.info("Agent dispatched for room: %s", req.room_name)
            except Exception as dispatch_err:
                logger.warning("Agent dispatch failed for room %s: %s", req.room_name, dispatch_err)
    except Exception as e:
        logger.error("Failed to create room %s: %s", req.room_name, e)
        raise HTTPException(status_code=500, detail=str(e))

    return SessionResponse(room_name=req.room_name, dispatched=dispatched)
