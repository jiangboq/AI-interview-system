from datetime import datetime, timezone

from pymongo import ASCENDING

from mongo import get_mongo_db


def _collection():
    db = get_mongo_db()
    col = db["transcripts"]
    col.create_index([("interview_id", ASCENDING)], unique=True, background=True)
    return col


def append_turn(interview_id: str, speaker: str, text: str, timestamp: str, section: str | None = None) -> None:
    turn = {"speaker": speaker, "text": text, "timestamp": timestamp, "section": section}
    now = datetime.now(timezone.utc).isoformat()
    _collection().update_one(
        {"interview_id": interview_id},
        {
            "$push": {"turns": turn},
            "$set": {"updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


def fetch_transcript(interview_id: str) -> dict | None:
    doc = _collection().find_one({"interview_id": interview_id}, {"_id": 0})
    return doc
