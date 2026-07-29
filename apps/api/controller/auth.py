import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import require_auth
from service import auth as auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    try:
        token = auth_service.login(req.username, req.password)
        return LoginResponse(token=token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.exception("Login failed for user %s", req.username)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh", response_model=LoginResponse)
def refresh(payload: dict = Depends(require_auth)):
    """Reissue a token with a renewed expiry. Called by the frontend on user
    activity so the session stays alive; if it stops being called (user idle),
    the existing token expires after ACCESS_TOKEN_EXPIRE_MINUTES."""
    token = auth_service.refresh(payload)
    return LoginResponse(token=token)
