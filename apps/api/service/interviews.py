from dao import interviews as interviews_dao


def get_all_interviews() -> list[dict]:
    return interviews_dao.fetch_all_interviews()


def create_interview(candidate_id: str, job_id: str) -> dict:
    return interviews_dao.insert_interview(candidate_id, job_id)
