import psycopg2.extras

from db import get_db


def fetch_org_ids_for_user(user_id: str) -> list[str]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT organization_id::text FROM organization_users WHERE user_id = %s",
                (user_id,),
            )
            return [row["organization_id"] for row in cur.fetchall()]


def insert_membership(organization_id: str, user_id: str, org_role: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO organization_users (organization_id, user_id, org_role)
                VALUES (%s, %s, %s)
                """,
                (organization_id, user_id, org_role),
            )
            conn.commit()
