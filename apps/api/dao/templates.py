import psycopg2.extras

from db import get_db


def fetch_all_templates(org_ids: list[str] | None) -> list[dict]:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT t.id::text, t.name, t.interview_type::text AS interview_type,
                       it.name AS interview_type_name, t.duration_minutes, t.is_global,
                       t.organization_id::text, o.name AS organization_name,
                       t.created_at::text, t.updated_at::text
                FROM interview_templates t
                LEFT JOIN interview_type it ON it.id = t.interview_type
                LEFT JOIN organizations o ON o.id = t.organization_id
                WHERE %s::uuid[] IS NULL OR t.is_global = TRUE OR t.organization_id = ANY(%s::uuid[])
                ORDER BY t.is_global DESC, o.name NULLS LAST, t.created_at DESC
                """,
                (org_ids, org_ids),
            )
            return [dict(row) for row in cur.fetchall()]


def fetch_template_by_id(template_id: str, org_ids: list[str] | None) -> dict | None:
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT t.id::text, t.name, t.interview_type::text AS interview_type,
                       it.name AS interview_type_name, t.duration_minutes, t.is_global,
                       t.organization_id::text, o.name AS organization_name, t.config_json,
                       t.created_at::text, t.updated_at::text
                FROM interview_templates t
                LEFT JOIN interview_type it ON it.id = t.interview_type
                LEFT JOIN organizations o ON o.id = t.organization_id
                WHERE t.id = %s
                  AND (%s::uuid[] IS NULL OR t.is_global = TRUE OR t.organization_id = ANY(%s::uuid[]))
                """,
                (template_id, org_ids, org_ids),
            )
            row = cur.fetchone()
            return dict(row) if row else None
