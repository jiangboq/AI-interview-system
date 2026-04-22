import os
import shutil
import uuid

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from deps import require_auth

router = APIRouter(prefix="/api/upload", tags=["upload"], dependencies=[Depends(require_auth)])

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
_S3_REGION = os.getenv("AWS_REGION", "us-east-1")
_S3_PREFIX = os.getenv("AWS_S3_PREFIX", "resumes")


class UploadResponse(BaseModel):
    url: str


def _upload_local(file: UploadFile, filename: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return f"/uploads/{filename}"


def _upload_s3(file: UploadFile, filename: str) -> str:
    key = f"{_S3_PREFIX}/{filename}"
    try:
        s3 = boto3.client("s3", region_name=_S3_REGION)
        s3.upload_fileobj(
            file.file,
            _S3_BUCKET,
            key,
            ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
        )
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=502, detail=f"S3 upload failed: {e}")
    return f"https://{_S3_BUCKET}.s3.{_S3_REGION}.amazonaws.com/{key}"


@router.post("/resume", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOC, and DOCX files are allowed.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")
    await file.seek(0)

    filename = f"{uuid.uuid4()}{ext}"

    if _S3_BUCKET:
        url = _upload_s3(file, filename)
    else:
        url = _upload_local(file, filename)

    return UploadResponse(url=url)
