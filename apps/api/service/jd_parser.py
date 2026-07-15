import os

from openai import OpenAI
from pydantic import BaseModel

_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

_SYSTEM_PROMPT = (
    "You are a job description parser. Extract the structured requirements from the job description text "
    "into the required JSON structure. Be thorough and accurate. If a field is absent from the description, "
    "use null for scalars and empty arrays for lists. Do not invent or infer requirements not explicitly stated."
)


class JobRequirements(BaseModel):
    required_skills: list[str] = []
    preferred_skills: list[str] = []
    min_years_experience: int | None = None
    education_requirements: list[str] = []
    key_responsibilities: list[str] = []


def parse_job_requirements(description: str) -> JobRequirements:
    response = _client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"<job_description>\n{description}\n</job_description>"},
        ],
        response_format=JobRequirements,
    )
    return response.choices[0].message.parsed
