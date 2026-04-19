from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from service import auth as auth_service

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
        raise HTTPException(status_code=500, detail=str(e))
