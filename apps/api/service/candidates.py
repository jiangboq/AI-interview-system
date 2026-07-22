from dao import candidates as candidates_dao


def get_all_candidates(limit: int, offset: int) -> tuple[list[dict], int]:
    return candidates_dao.fetch_all_candidates(limit, offset)


def create_candidate(full_name: str, email: str, resume_url: str | None = None) -> dict:
    return candidates_dao.insert_candidate(full_name, email, resume_url)
