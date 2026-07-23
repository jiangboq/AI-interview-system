import logging
import os
import uuid

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from dao.resume_blobs import (
    insert_resume_blob,
    update_blob_done,
    update_blob_failed,
    update_blob_parse_failed,
    update_blob_parsed,
    update_blob_parsing,
    update_blob_processing,
)
from deps import require_auth
from service.llm_resume_parser import parse_resume
from service.resume_parser import extract_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"], dependencies=[Depends(require_auth)])

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
_S3_REGION = os.getenv("AWS_REGION", "us-east-1")
_S3_PREFIX = os.getenv("AWS_S3_PREFIX", "resumes")


class UploadResponse(BaseModel):
    url: str
    blob_id: str


def _upload_local(contents: bytes, filename: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(contents)
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
        logger.exception("S3 upload failed for %s", key)
        raise HTTPException(status_code=502, detail=f"S3 upload failed: {e}")
    return f"https://{_S3_BUCKET}.s3.{_S3_REGION}.amazonaws.com/{key}"


def _process_resume(blob_id: str, file_bytes: bytes, ext: str) -> None:
    update_blob_processing(blob_id)
    try:
        raw_text = extract_text(file_bytes, ext)
        update_blob_done(blob_id, raw_text)
    except Exception as e:
        logger.exception("Failed to extract text for resume blob %s", blob_id)
        update_blob_failed(blob_id, str(e))
        return

    update_blob_parsing(blob_id)
    try:
        parsed = parse_resume(raw_text)
        update_blob_parsed(blob_id, parsed.model_dump())
    except Exception as e:
        logger.exception("Failed to parse resume for blob %s", blob_id)
        update_blob_parse_failed(blob_id, str(e))


@router.post("/resume", response_model=UploadResponse)
async def upload_resume(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOC, and DOCX files are allowed.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")

    filename = f"{uuid.uuid4()}{ext}"

    if _S3_BUCKET:
        await file.seek(0)
        url = _upload_s3(file, filename)
    else:
        url = _upload_local(contents, filename)

    blob = insert_resume_blob(file_url=url, file_ext=ext)
    background_tasks.add_task(_process_resume, blob["id"], contents, ext)

    return UploadResponse(url=url, blob_id=blob["id"])
