from dao import jobs as jobs_dao


def get_all_jobs(org_ids: list[str]) -> list[dict]:
    return jobs_dao.fetch_all_jobs(org_ids)


def create_job(title: str, description: str, level: str, organization_id: str) -> dict:
    return jobs_dao.insert_job(title, description, level, organization_id)


def get_job(job_id: str, org_ids: list[str]) -> dict | None:
    return jobs_dao.fetch_job_by_id(job_id, org_ids)


def update_job(
    job_id: str, title: str, description: str, level: str, organization_id: str, org_ids: list[str]
) -> dict | None:
    return jobs_dao.update_job(job_id, title, description, level, organization_id, org_ids)
