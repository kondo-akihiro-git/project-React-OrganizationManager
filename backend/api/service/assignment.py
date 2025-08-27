# backend/api/service/assignment.py
import json
from db.connection.connection import get_connection, release_connection
from typing import List, Dict, Any

# position.json をロードして辞書化
with open("db/json/position.json", "r", encoding="utf-8") as f:
    POSITION_DICT = {p["name"]: p["level"] for p in json.load(f)}

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
            section_parts = record["section_name"].split(" / ")  # "第一営業課(PP/BP)/SES(PP)" など
            section_1_name = section_parts[0].strip() if len(section_parts) > 0 else None
            section_2_name = section_parts[1].strip() if len(section_parts) > 1 else None
            pos_name = record["position_name"] or "役職不明"
            emp_id = record["employee_id"]
            emp_name = record["employee_name"]

            # department
            dept_node = next((d for d in tree if d["name"] == dept_name), None)
            if not dept_node:
                dept_node = {"name": dept_name, "type": "department", "children": []}
                tree.append(dept_node)

            # section_1
            section_1_node = next((s for s in dept_node["children"] if s["name"] == section_1_name), None)
            if not section_1_node:
                section_1_node = {"name": section_1_name, "type": "section_1", "children": []}
                dept_node["children"].append(section_1_node)

            # section_2（存在すれば）
            if section_2_name:
                section_2_node = next((s for s in section_1_node["children"] if s["name"] == section_2_name), None)
                if not section_2_node:
                    section_2_node = {"name": section_2_name, "type": "section_2", "children": []}
                    section_1_node["children"].append(section_2_node)
                parent_section_node = section_2_node
            else:
                parent_section_node = section_1_node

            # position
            pos_level = POSITION_DICT.get(pos_name, "position_4")
            pos_node = next((p for p in parent_section_node["children"] if p["name"] == pos_name), None)
            if not pos_node:
                pos_node = {"name": pos_name, "type": pos_level, "employees": []}
                parent_section_node["children"].append(pos_node)

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
