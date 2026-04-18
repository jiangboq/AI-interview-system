import os
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://jiangboqiu:admin@localhost:5432/interview")


@contextmanager
def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

app = FastAPI(title="AI Interview System API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Job(BaseModel):
    id: str
    title: str | None
    description: str | None
    level: str | None


class InterviewStartRequest(BaseModel):
    candidate_name: str
    position: str


class InterviewStartResponse(BaseModel):
    session_id: str
    candidate_name: str
    position: str
    first_question: str


@app.get("/")
def root():
    return {"service": "AI Interview System API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/jobs", response_model=list[Job])
def list_jobs():
    try:
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT id::text, title, description, level FROM jobs ORDER BY created_at DESC")
                return [Job(**row) for row in cur.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/start", response_model=InterviewStartResponse)
def start_interview(req: InterviewStartRequest):
    return InterviewStartResponse(
        session_id="demo-session-001",
        candidate_name=req.candidate_name,
        position=req.position,
        first_question=f"Hi {req.candidate_name}, welcome! Tell me about your background relevant to the {req.position} role.",
    )


@app.get("/api/interview/questions")
def list_demo_questions():
    return {
        "questions": [
            "Tell me about yourself.",
            "What's your greatest strength?",
            "Describe a challenging project you worked on.",
            "Why are you interested in this position?",
            "Where do you see yourself in 5 years?",
        ]
    }
