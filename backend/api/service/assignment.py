# backend/api/service/assignment.py
import json
from db.connection.connection import get_connection, release_connection
from typing import List, Dict, Any

# sales_position.json をロードして辞書化
with open("db/json/sales_position.json", "r", encoding="utf-8") as f:
    POSITION_DICT = {p["id"]: {"name": p["name"], "level": p.get("level", "position_4")} for p in json.load(f)}

# 部署マスタをロード
with open("db/json/all_department.json", "r", encoding="utf-8") as f:
    DEPT_DICT = {d["id"]: d["name"] for d in json.load(f)}

# 親セクション
with open("db/json/sales_parent_section.json", "r", encoding="utf-8") as f:
    PARENT_SECTION_DICT = {s["id"]: s["name"] for s in json.load(f)}

# 子セクション
with open("db/json/sales_child_section.json", "r", encoding="utf-8") as f:
    CHILD_SECTION_DICT = {s["id"]: {"name": s["name"], "parent_id": s.get("parent_id")} for s in json.load(f)}


async def get_sales_assignment() -> List[Dict[str, Any]]:
    conn = await get_connection()
    try:
        query = """
        SELECT
            a.id AS assignment_id,
            e.id AS employee_id,
            e.name AS employee_name,
            a.department_id,
            a.sales_parent_section_id,
            a.sales_child_section_id,
            a.sales_manager_id,
            a.sales_submanager_id,
            a.sales_leader_id,
            a.sales_position_id
        FROM sales_assignment a
        JOIN employee e ON a.employee_id = e.id
        ORDER BY a.id;
        """
        rows = await conn.fetch(query)
        assignments = [dict(row) for row in rows]

        # 事前に全社員をキャッシュしておく（名前を引く用）
        emp_rows = await conn.fetch("SELECT id, name FROM employee;")
        EMP_DICT = {r["id"]: r["name"] for r in emp_rows}

        result: List[Dict[str, Any]] = []

        for record in assignments:
            dept_name = DEPT_DICT.get(record["department_id"], "不明")
            section_parent_name = PARENT_SECTION_DICT.get(record["sales_parent_section_id"], "不明")
            section_child_name = (
                CHILD_SECTION_DICT.get(record["sales_child_section_id"], {}).get("name")
                if record["sales_child_section_id"]
                else None
            )
            pos_info = POSITION_DICT.get(
                record["sales_position_id"], {"name": "役職不明", "level": "position_4"}
            )
            pos_name = pos_info["name"]

            emp_node = {
                "id": record["employee_id"],
                "name": record["employee_name"],
                "department": dept_name,
                "parent_section": section_parent_name,
                "child_section": section_child_name,
                "position": pos_name,
                "manager_id": record["sales_manager_id"],
                "manager_name": EMP_DICT.get(record["sales_manager_id"]) if record["sales_manager_id"] else None,
                "submanager_id": record["sales_submanager_id"],
                "submanager_name": EMP_DICT.get(record["sales_submanager_id"]) if record["sales_submanager_id"] else None,
                "leader_id": record["sales_leader_id"],
                "leader_name": EMP_DICT.get(record["sales_leader_id"]) if record["sales_leader_id"] else None,
            }

            result.append(emp_node)

        return result
    finally:
        await release_connection(conn)
