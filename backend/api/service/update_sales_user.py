from api.schema.user_shema import CreateSalesUserRequest
from db.connection.connection import get_connection, release_connection

async def update_sales_user(role: str, user_id: int, user: CreateSalesUserRequest) -> dict:
    conn = await get_connection()
    try:
        if role == "manager":
            row = await conn.fetchrow(
                "UPDATE sales_manager SET name = $1, department_id = $2, exists = $3 WHERE id = $4 RETURNING id, name, department_id, exists",
                user.name, user.department_id, user.exists, user_id
            )
        elif role == "sub_manager":
            row = await conn.fetchrow(
                "UPDATE sales_sub_manager SET name = $1, team_id = $2, manager_id = $3, department_id = $4, exists = $5 WHERE id = $6 RETURNING id, name, team_id, manager_id, department_id, exists",
                user.name, user.team_id, user.manager_id, user.department_id, user.exists, user_id
            )
        elif role == "leader":
            row = await conn.fetchrow(
                "UPDATE sales_leader SET name = $1, sub_manager_id = $2, team_id = $3, manager_id = $4, department_id = $5, exists = $6 WHERE id = $7 RETURNING id, name, sub_manager_id, team_id, manager_id, department_id, exists",
                user.name, user.sub_manager_id, user.team_id, user.manager_id, user.department_id, user.exists, user_id
            )
        elif role == "member":
            row = await conn.fetchrow(
                "UPDATE sales_member SET name = $1, title = $2, leader_id = $3, sub_manager_id = $4, team_id = $5, manager_id = $6, department_id = $7 WHERE id = $8 RETURNING id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id",
                user.name, user.title or "メンバー", user.leader_id, user.sub_manager_id, user.team_id, user.manager_id, user.department_id, user_id
            )
        else:
            raise ValueError(f"Invalid role: {role}")

        if not row:
            return {"status": "not_found", "role": role, "id": user_id, "message": f"No {role} found with id {user_id}"}
        return {"status": "updated", "role": role, **dict(row)}

    finally:
        await release_connection(conn)