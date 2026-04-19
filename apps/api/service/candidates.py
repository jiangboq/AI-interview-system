from dao import candidates as candidates_dao


def get_all_candidates() -> list[dict]:
    return candidates_dao.fetch_all_candidates()


def create_candidate(full_name: str, email: str) -> dict:
    return candidates_dao.insert_candidate(full_name, email)
