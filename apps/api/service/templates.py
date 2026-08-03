from dao import templates as templates_dao


def get_all_templates(org_ids: list[str] | None) -> list[dict]:
    return templates_dao.fetch_all_templates(org_ids)


def get_template(template_id: str, org_ids: list[str] | None) -> dict | None:
    return templates_dao.fetch_template_by_id(template_id, org_ids)
