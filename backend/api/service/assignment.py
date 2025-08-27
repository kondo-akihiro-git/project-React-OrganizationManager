# backend/api/service/assignment.py
from db.connection.connection import get_connection, release_connection
from typing import List, Dict, Any

async def get_assignment() -> List[Dict[str, Any]]:
    conn = await get_connection()
    try:
        query = """
        SELECT
            a.id AS assignment_id,
            e.id AS employee_id,
            e.name AS employee_name,
            a.department_name,
            a.section_name,
            a.position_name,
            a.parent_employee_id
        FROM assignments a
        JOIN employees e ON a.employee_id = e.id
        ORDER BY a.department_name, a.section_name, a.id;
        """
        rows = await conn.fetch(query)
        assignments = [dict(row) for row in rows]

        tree: List[Dict[str, Any]] = []

        # department -> section -> position -> employees
        for record in assignments:
            dept_name = record["department_name"]
            section_name = record["section_name"]
            pos_name = record["position_name"] or "役職不明"
            emp_id = record["employee_id"]
            emp_name = record["employee_name"]

            # department
            dept_node = next((d for d in tree if d["name"] == dept_name), None)
            if not dept_node:
                dept_node = {"name": dept_name, "type": "department", "children": []}
                tree.append(dept_node)

            # section
            section_node = next((s for s in dept_node["children"] if s["name"] == section_name), None)
            if not section_node:
                section_node = {"name": section_name, "type": "section", "children": []}
                dept_node["children"].append(section_node)

            # position
            pos_node = next((p for p in section_node["children"] if p["name"] == pos_name), None)
            if not pos_node:
                pos_node = {"name": pos_name, "type": "position", "employees": []}
                section_node["children"].append(pos_node)

            # 社員を追加
            pos_node["employees"].append({
                "id": emp_id,
                "name": emp_name,
                "position": pos_name,
                "parent_employee_id": record["parent_employee_id"]
            })

        return tree

    finally:
        await release_connection(conn)
