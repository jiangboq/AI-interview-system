from dao import users as users_dao
from service.auth import hash_password


def get_all_users(limit: int, offset: int) -> tuple[list[dict], int]:
    return users_dao.fetch_all_users(limit, offset)


def get_user_by_id(user_id: str) -> dict | None:
    return users_dao.fetch_user_by_id(user_id)


def create_user(name: str, email: str, username: str, password: str, role: str) -> dict:
    return users_dao.insert_user(name, email, username, hash_password(password), role)
