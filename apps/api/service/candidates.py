from dao import candidates as candidates_dao


def get_all_candidates() -> list[dict]:
    return candidates_dao.fetch_all_candidates()
