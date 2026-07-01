import json
import os

from openai import OpenAI
from pydantic import BaseModel

_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
_MODEL = os.getenv("SCORING_LLM_MODEL", "gpt-4.1-mini")

_SYSTEM_PROMPT = (
    "You are an expert technical interviewer evaluating a candidate's performance based on an interview "
    "transcript. Score objectively based only on what the candidate actually said. If the transcript is too "
    "short or thin to assess a dimension, score it low and say so in the rationale rather than inventing "
    "evidence. When past candidates are provided, use them as a calibration reference so your scores are "
    "consistent and not biased by order."
)


class DimensionScore(BaseModel):
    name: str
    score: float
    evidence: list[str]
    rationale: str


class ScoreCard(BaseModel):
    overall_score: float
    recommendation: str
    summary: str
    strengths: list[str]
    concerns: list[str]
    dimensions: list[DimensionScore]


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


def _format_transcript(turns: list[dict]) -> str:
    return "\n".join(f"{turn['speaker']}: {turn['text']}" for turn in turns)


def _build_calibration_block(past_scorecards: list[dict]) -> str:
    if not past_scorecards:
        return ""
    lines = []
    for i, sc in enumerate(past_scorecards, 1):
        strengths = ", ".join(sc.get("strengths") or [])
        concerns = ", ".join(sc.get("concerns") or [])
        lines.append(
            f"Candidate {i}: overall={sc['overall_score']}, recommendation={sc['recommendation']}\n"
            f"  Summary: {sc.get('summary', '')}\n"
            f"  Strengths: {strengths}\n"
            f"  Concerns: {concerns}"
        )
    return "<past_candidates>\n" + "\n\n".join(lines) + "\n</past_candidates>\n\n"


def score_interview(
    turns: list[dict],
    job_title: str | None,
    job_level: str | None,
    past_scorecards: list[dict] | None = None,
) -> ScoreCard:
    context_lines = []
    if job_title:
        level_str = f" ({job_level} level)" if job_level else ""
        context_lines.append(f"The candidate interviewed for: {job_title}{level_str}.")
    context = ("\n" + "\n".join(context_lines)) if context_lines else ""

    calibration = _build_calibration_block(past_scorecards or [])

    response = _client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT + context},
            {
                "role": "user",
                "content": f"{calibration}<transcript>\n{_format_transcript(turns)}\n</transcript>",
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "score_card",
                "schema": _close_schema(ScoreCard.model_json_schema()),
                "strict": True,
            },
        },
    )

    text = response.choices[0].message.content
    return ScoreCard.model_validate(json.loads(text))
