from dao import organizations as organizations_dao


def get_all_organizations(limit: int, offset: int) -> tuple[list[dict], int]:
    return organizations_dao.fetch_all_organizations(limit, offset)


def create_organization(name: str) -> dict:
    return organizations_dao.insert_organization(name)
