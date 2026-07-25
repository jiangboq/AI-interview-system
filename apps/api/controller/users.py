from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException

from deps import require_auth
from pagination import Page, PageParams
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
    organization_id: str


@router.get("", response_model=Page[User])
def list_users(page_params: PageParams = Depends()):
    try:
        items, total = users_service.get_all_users(page_params.limit, page_params.offset)
        return Page.create(items, total, page_params.page, page_params.page_size)
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
        return users_service.create_user(
            req.name, req.email, req.username, req.password, req.role, req.organization_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
