import hashlib
import os
from datetime import datetime, timedelta, timezone

from jose import jwt

from dao import users as users_dao

JWT_SECRET = os.getenv("SECRET_KEY", "changeme-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
CANDIDATE_SESSION_MINUTES = int(os.getenv("CANDIDATE_SESSION_MINUTES", "120"))


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _issue_token(user_id: str, username: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRY_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def login(username: str, password: str) -> str:
    user = users_dao.fetch_user_by_username(username)
    if not user or user["password_hash"] != hash_password(password):
        raise ValueError("Invalid username or password")

    return _issue_token(user["id"], user["username"], user["role"])


def refresh(payload: dict) -> str:
    """Reissue a token with a renewed expiry, extending the session on activity."""
    return _issue_token(payload["sub"], payload["username"], payload["role"])


def issue_candidate_token(interview_id: str, invite_token: str) -> str:
    """Short-lived session token scoped to one interview, minted only after the
    candidate confirms their email + access code. Required to start/join the
    LiveKit room for that interview."""
    now = datetime.now(timezone.utc)
    payload = {
        "role": "candidate",
        "interview_id": interview_id,
        "invite_token": invite_token,
        "iat": now,
        "exp": now + timedelta(minutes=CANDIDATE_SESSION_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
