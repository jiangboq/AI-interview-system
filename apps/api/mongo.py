import os

from pymongo import MongoClient
from pymongo.database import Database

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
_client: MongoClient | None = None


def get_mongo_db() -> Database:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URL)
    return _client["interview"]
