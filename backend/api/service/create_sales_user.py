# backend/api/service/create_sales_user.py
from api.schema.user_shema import CreateSalesUserRequest
from db.connection.connection import get_connection, release_connection

async def create_sales_user(user: CreateSalesUserRequest) -> dict:
    conn = await get_connection()
    try:
        if user.role == "department":
            row = await conn.fetchrow(
                "INSERT INTO sales_department (name) VALUES ($1) RETURNING id, name",
                user.name,
            )
        elif user.role == "manager":
            row = await conn.fetchrow(
                "INSERT INTO sales_manager (name, department_id) VALUES ($1, $2) RETURNING id, name, department_id",
                user.name, user.department_id
            )
        elif user.role == "sub_manager":
            row = await conn.fetchrow(
                "INSERT INTO sales_sub_manager (name, team_id, manager_id, department_id) VALUES ($1, $2, $3, $4) RETURNING id, name, team_id, manager_id, department_id",
                user.name, user.team_id, user.manager_id, user.department_id
            )
        elif user.role == "leader":
            row = await conn.fetchrow(
                "INSERT INTO sales_leader (name, sub_manager_id, team_id, manager_id, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, sub_manager_id, team_id, manager_id, department_id",
                user.name, user.sub_manager_id, user.team_id, user.manager_id, user.department_id
            )
        elif user.role == "member":
            row = await conn.fetchrow(
                "INSERT INTO sales_member (name, title, leader_id, sub_manager_id, team_id, manager_id, department_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id",
                user.name, user.title or "メンバー", user.leader_id, user.sub_manager_id, user.team_id, user.manager_id, user.department_id
            )
        else:
            raise ValueError("Invalid role")

        return dict(row)
    finally:
        await release_connection(conn)
