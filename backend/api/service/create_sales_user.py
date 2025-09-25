# backend/api/service/create_sales_user.py
from api.schema.user_shema import CreateSalesUserRequest
# backend/api/service/create_sales_user.py
from api.schema.user_shema import CreateSalesUserRequest
from db.connection.connection import get_connection, release_connection

ROLE_ID_RANGE = {
    "manager": (20001, 29999),
    "sub_manager": (40001, 49999),
    "leader": (50001, 59999),
    "member": (60001, 69999),
}

async def _generate_next_id(conn, table_name: str, role: str) -> int:
    min_id, max_id = ROLE_ID_RANGE[role]
    query = f"SELECT MAX(id) FROM {table_name}"
    row = await conn.fetchval(query)
    next_id = row + 1 if row is not None else min_id
    if next_id > max_id:
        raise ValueError(f"{role} id exceeded range {min_id}-{max_id}")
    return next_id

async def create_sales_user(user: CreateSalesUserRequest) -> dict:
    conn = await get_connection()
    try:
        # ID自動生成
        if user.id is None:
            table_map = {
                "manager": "sales_manager",
                "sub_manager": "sales_sub_manager",
                "leader": "sales_leader",
                "member": "sales_member",
            }
            user.id = await _generate_next_id(conn, table_map[user.role], user.role)

        if user.role == "manager":
            row = await conn.fetchrow(
                "INSERT INTO sales_manager (id, name, department_id, exists) VALUES ($1, $2, $3, $4) RETURNING id, name, department_id, exists",
                user.id, user.name, user.department_id, user.exists
            )
        elif user.role == "sub_manager":
            row = await conn.fetchrow(
                "INSERT INTO sales_sub_manager (id, name, team_id, manager_id, department_id, exists) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, team_id, manager_id, department_id, exists",
                user.id, user.name, user.team_id, user.manager_id, user.department_id, user.exists
            )
        elif user.role == "leader":
            row = await conn.fetchrow(
                "INSERT INTO sales_leader (id, name, sub_manager_id, team_id, manager_id, department_id, exists) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, sub_manager_id, team_id, manager_id, department_id, exists",
                user.id, user.name, user.sub_manager_id, user.team_id, user.manager_id, user.department_id, user.exists
            )
        elif user.role == "member":
            row = await conn.fetchrow(
                "INSERT INTO sales_member (id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id",
                user.id, user.name, user.title or "メンバー", user.leader_id, user.sub_manager_id, user.team_id, user.manager_id, user.department_id
            )
        else:
            raise ValueError("Invalid role")

        return dict(row)
    finally:
        await release_connection(conn)
