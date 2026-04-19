from dao import jobs as jobs_dao


def get_all_jobs() -> list[dict]:
    return jobs_dao.fetch_all_jobs()


def create_job(title: str, description: str, level: str) -> dict:
    return jobs_dao.insert_job(title, description, level)
