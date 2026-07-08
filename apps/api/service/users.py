from dao import users as users_dao


def get_all_users() -> list[dict]:
    return users_dao.fetch_all_users()
