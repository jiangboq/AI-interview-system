import os
import time
from contextlib import contextmanager
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import psycopg2
import psycopg2.extras
from psycopg2.pool import PoolError, ThreadedConnectionPool


def _with_default_sslmode(url: str, default_sslmode: str) -> str:
    """Apply a default sslmode if the DSN doesn't already specify one.

    An explicit sslmode in DATABASE_URL always wins, so this only fills
    in a safe default rather than forcing SSL on connections that opt out.
    """
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    if "sslmode" in query:
        return url
    query["sslmode"] = [default_sslmode]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


DATABASE_URL = _with_default_sslmode(
    os.getenv("DATABASE_URL", "postgresql://jiangboqiu:admin@localhost:5432/interview"),
    os.getenv("DB_SSLMODE", "prefer"),
)
DB_POOL_MIN_SIZE = int(os.getenv("DB_POOL_MIN_SIZE", "1"))
DB_POOL_MAX_SIZE = int(os.getenv("DB_POOL_MAX_SIZE", "10"))
# getconn() raises immediately if the pool is exhausted rather than waiting,
# so briefly retry to smooth over request bursts above the pool size.
DB_POOL_ACQUIRE_TIMEOUT = float(os.getenv("DB_POOL_ACQUIRE_TIMEOUT", "5"))
DB_POOL_ACQUIRE_RETRY_INTERVAL = 0.05

_pool: ThreadedConnectionPool | None = None


def init_pool():
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(DB_POOL_MIN_SIZE, DB_POOL_MAX_SIZE, dsn=DATABASE_URL)
    return _pool


def close_pool():
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None


def _acquire(pool: ThreadedConnectionPool):
    deadline = time.monotonic() + DB_POOL_ACQUIRE_TIMEOUT
    while True:
        try:
            return pool.getconn()
        except PoolError:
            if time.monotonic() >= deadline:
                raise
            time.sleep(DB_POOL_ACQUIRE_RETRY_INTERVAL)


@contextmanager
def get_db():
    pool = init_pool()
    conn = _acquire(pool)
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
