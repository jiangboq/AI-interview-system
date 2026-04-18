from dao import jobs as jobs_dao


def get_all_jobs() -> list[dict]:
    return jobs_dao.fetch_all_jobs()
