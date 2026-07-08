from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException

from deps import require_auth
from pydantic import BaseModel
from service import users as users_service

router = APIRouter(prefix="/api/users", tags=["users"], dependencies=[Depends(require_auth)])


class User(BaseModel):
    id: str
    name: str | None
    email: str | None
    username: str | None
    role: str | None
    created_at: datetime | None


class CreateUserRequest(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: Literal["candidate", "recruiter", "admin"] = "candidate"


@router.get("", response_model=list[User])
def list_users():
    try:
        return users_service.get_all_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=User)
def get_current_user(payload: dict = Depends(require_auth)):
    user = users_service.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=User, status_code=201)
def create_user(req: CreateUserRequest):
    try:
        return users_service.create_user(req.name, req.email, req.username, req.password, req.role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
