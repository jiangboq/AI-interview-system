import os

from openai import OpenAI
from pydantic import BaseModel

_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

_SYSTEM_PROMPT = (
    "You are a resume parser. Extract all information from the resume text into the required JSON structure. "
    "Be thorough and accurate. If a field is absent from the resume, use null for strings and empty arrays for lists. "
    "Do not invent or infer information not explicitly stated."
)


class ContactInfo(BaseModel):
    email: str | None = None
    phone: str | None = None
    linkedin: str | None = None
    github: str | None = None
    location: str | None = None


class WorkExperience(BaseModel):
    company: str
    title: str
    start_date: str | None = None
    end_date: str | None = None
    description: list[str] = []


class Education(BaseModel):
    institution: str
    degree: str | None = None
    field: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    gpa: str | None = None


class ParsedResume(BaseModel):
    full_name: str | None = None
    contact: ContactInfo = ContactInfo()
    summary: str | None = None
    work_experience: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[str] = []
    certifications: list[str] = []
    languages: list[str] = []


def parse_resume(raw_text: str) -> ParsedResume:
    response = _client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"<resume_text>\n{raw_text}\n</resume_text>"},
        ],
        response_format=ParsedResume,
    )
    return response.choices[0].message.parsed
