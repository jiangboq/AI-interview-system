from dao import organizations as organizations_dao


def get_all_organizations() -> list[dict]:
    return organizations_dao.fetch_all_organizations()


def create_organization(name: str) -> dict:
    return organizations_dao.insert_organization(name)
