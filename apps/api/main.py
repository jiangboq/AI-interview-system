import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from controller.auth import router as auth_router
from controller.candidates import router as candidates_router
from controller.interviews import router as interviews_router
from controller.jobs import router as jobs_router
from controller.upload import router as upload_router

app = FastAPI(title="AI Interview System API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(interviews_router)
app.include_router(upload_router)

_upload_dir = "uploads"
os.makedirs(_upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_upload_dir), name="uploads")


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
