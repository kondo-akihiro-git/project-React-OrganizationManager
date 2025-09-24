from db.connection.connection import get_connection, release_connection

async def delete_sales_user(role: str, user_id: int) -> dict:
    conn = await get_connection()
    try:
        if role == "department":
            row = await conn.fetchrow(
                "DELETE FROM sales_department WHERE id = $1 RETURNING id, name, exists",
                user_id
            )
        elif role == "manager":
            row = await conn.fetchrow(
                "DELETE FROM sales_manager WHERE id = $1 RETURNING id, name, department_id, exists",
                user_id
            )
        elif role == "team":
            row = await conn.fetchrow(
                "DELETE FROM sales_team WHERE id = $1 RETURNING id, name, department_id, manager_id, exists",
                user_id
            )
        elif role == "sub_manager":
            row = await conn.fetchrow(
                "DELETE FROM sales_sub_manager WHERE id = $1 RETURNING id, name, team_id, manager_id, department_id, exists",
                user_id
            )
        elif role == "leader":
            row = await conn.fetchrow(
                "DELETE FROM sales_leader WHERE id = $1 RETURNING id, name, sub_manager_id, team_id, manager_id, department_id, exists",
                user_id
            )
        elif role == "member":
            row = await conn.fetchrow(
                "DELETE FROM sales_member WHERE id = $1 RETURNING id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id",
                user_id
            )
        else:
            raise ValueError(f"Invalid role: {role}")

        if not row:
            return {"status": "not_found", "role": role, "id": user_id, "message": f"No {role} found with id {user_id}"}
        return {"status": "deleted", "role": role, **dict(row)}

    finally:
        await release_connection(conn)