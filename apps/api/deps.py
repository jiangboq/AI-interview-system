import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from dao import organization_users as organization_users_dao

JWT_SECRET = os.getenv("SECRET_KEY", "changeme-secret")
JWT_ALGORITHM = "HS256"

_bearer = HTTPBearer()


def require_auth(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    try:
        return jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def require_admin(payload: dict = Depends(require_auth)) -> dict:
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return payload


def require_candidate(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    """Validates the short-lived, interview-scoped token minted after a candidate
    confirms their email + access code. Used to gate starting/joining a LiveKit room."""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired candidate session",
        )
    if payload.get("role") != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate session required",
        )
    return payload


def require_service(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    """Validates the service-to-service token the voice-agent self-signs (using the
    same SECRET_KEY) to call back into the API on behalf of an in-progress interview."""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired service token",
        )
    if payload.get("role") != "service":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Service token required",
        )
    return payload


def get_org_ids(payload: dict = Depends(require_auth)) -> list[str] | None:
    """Organization ids the current user belongs to, per organization_users.

    Membership alone grants org-scoped (HR user) access for now; org_role is
    not yet used to differentiate behavior. Admins get `None`, meaning
    unrestricted access to all organizations.
    """
    if payload.get("role") == "admin":
        return None
    return organization_users_dao.fetch_org_ids_for_user(payload["sub"])
