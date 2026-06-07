import json
import os

from anthropic import Anthropic
from pydantic import BaseModel

_client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

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


def _close_schema(schema: dict) -> dict:
    """Recursively set additionalProperties=false on all object nodes."""
    if schema.get("type") == "object":
        schema.setdefault("additionalProperties", False)
    for key in ("properties", "$defs"):
        if key in schema:
            for v in schema[key].values():
                _close_schema(v)
    if "items" in schema:
        _close_schema(schema["items"])
    return schema


def parse_resume(raw_text: str) -> ParsedResume:
    response = _client.messages.create(
        model="claude-opus-4-8",
        max_tokens=8192,
        thinking={"type": "adaptive"},
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"<resume_text>\n{raw_text}\n</resume_text>",
            }
        ],
        output_config={
            "format": {
                "type": "json_schema",
                "schema": _close_schema(ParsedResume.model_json_schema()),
            }
        },
    )

    text = next(block.text for block in response.content if block.type == "text")
    return ParsedResume.model_validate(json.loads(text))
