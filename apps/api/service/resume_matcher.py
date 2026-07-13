import json
import os

from openai import OpenAI
from pydantic import BaseModel

_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
_MODEL = os.getenv("MATCHING_LLM_MODEL", "gpt-4.1-mini")

_SYSTEM_PROMPT = (
    "You are an expert technical recruiter evaluating how well a candidate's resume matches a job's "
    "requirements. Score objectively based only on what the resume and requirements explicitly state. "
    "Do not invent or assume skills, experience, or education not present in the resume. If the resume is "
    "too thin to assess a requirement, treat it as unmet rather than inventing evidence."
)


class MatchScore(BaseModel):
    overall_score: float
    recommendation: str
    matched_skills: list[str]
    missing_skills: list[str]
    experience_fit: str
    education_fit: str
    summary: str


def _close_schema(schema: dict) -> dict:
    """Recursively set additionalProperties=false and required=all properties (OpenAI strict mode)."""
    if schema.get("type") == "object" and "properties" in schema:
        schema["additionalProperties"] = False
        schema["required"] = list(schema["properties"].keys())
    for key in ("properties", "$defs"):
        if key in schema:
            for v in schema[key].values():
                _close_schema(v)
    if "items" in schema:
        _close_schema(schema["items"])
    return schema


def score_match(parsed_resume: dict, job_requirements: dict) -> MatchScore:
    response = _client.chat.completions.create(
        model=_MODEL,
        temperature=0,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"<job_requirements>\n{json.dumps(job_requirements)}\n</job_requirements>\n\n"
                    f"<resume>\n{json.dumps(parsed_resume)}\n</resume>"
                ),
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "match_score",
                "schema": _close_schema(MatchScore.model_json_schema()),
                "strict": True,
            },
        },
    )

    text = response.choices[0].message.content
    return MatchScore.model_validate(json.loads(text))
