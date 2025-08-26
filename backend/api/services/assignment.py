# api/services/assignment.py
from db.connection.connection import get_connection, release_connection

async def get_all_assignments_service():
    conn = await get_connection()
    try:
        query = """
        SELECT
            a.id AS assignment_id,
            e.id AS employee_id,
            e.name AS employee_name,
            d.id AS department_id,
            d.name AS department_name,
            s.id AS section_id,
            s.name AS section_name,
            s.parent_id AS parent_section_id,
            p.id AS position_id,
            p.name AS position_name
        FROM assignments a
        JOIN employees e ON a.employee_id = e.id
        JOIN sections s ON a.section_id = s.id
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN positions p ON a.position_id = p.id
        ORDER BY e.id;
        """
        # fetch で全件取得する際は await を必ずつける
        rows = await conn.fetch(query)
        return [dict(row) for row in rows]
    finally:
        # release は try/finally 内で最後に必ず行う
        await release_connection(conn)
