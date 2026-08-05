from dao import consent_records as consent_records_dao


def get_consent_record(version: str) -> dict | None:
    return consent_records_dao.fetch_consent_record_by_version(version)


def record_consent(interview_id: str, version: str) -> dict | None:
    return consent_records_dao.insert_user_consent(interview_id, version)
