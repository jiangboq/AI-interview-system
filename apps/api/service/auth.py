import hashlib
import os
from datetime import datetime, timedelta, timezone

from jose import jwt

from dao import users as users_dao

JWT_SECRET = os.getenv("JWT_SECRET", "changeme-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = 60


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def login(username: str, password: str) -> str:
    user = users_dao.fetch_user_by_username(username)
    if not user or user["password_hash"] != _hash_password(password):
        raise ValueError("Invalid username or password")

    payload = {
        "sub": user["id"],
        "username": user["username"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRY_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
