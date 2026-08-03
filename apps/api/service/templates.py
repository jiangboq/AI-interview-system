from dao import templates as templates_dao


def get_all_templates(org_ids: list[str] | None) -> list[dict]:
    return templates_dao.fetch_all_templates(org_ids)
