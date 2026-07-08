import os

from openai import OpenAI

from service.interview_scorer import ScoreCard

_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
_EMBED_MODEL = "text-embedding-3-small"


def generate_embedding(text: str) -> list[float]:
    text = text.replace("\n", " ").strip()
    response = _client.embeddings.create(model=_EMBED_MODEL, input=text)
    return response.data[0].embedding


def scorecard_text(scorecard: ScoreCard, job_title: str | None, job_level: str | None) -> str:
    level_str = f" ({job_level})" if job_level else ""
    job_str = f"Job: {job_title}{level_str}" if job_title else ""
    dim_text = " | ".join(
        f"{d.name}: {d.score:.1f} — {d.rationale}" for d in scorecard.dimensions
    )
    return f"{job_str} | Overall: {scorecard.overall_score} | {scorecard.summary} | {dim_text}"
