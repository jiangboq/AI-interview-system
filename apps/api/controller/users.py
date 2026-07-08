from datetime import datetime

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


@router.get("", response_model=list[User])
def list_users():
    try:
        return users_service.get_all_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
