import os
import time
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from psycopg2.pool import PoolError, ThreadedConnectionPool

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://jiangboqiu:admin@localhost:5432/interview")
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
