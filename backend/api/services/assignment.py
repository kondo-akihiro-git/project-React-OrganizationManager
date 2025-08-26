# api/services/assignment.py
from db.connection.connection import get_connection, release_connection
from typing import List, Dict, Any

async def get_all_assignments_service() -> List[Dict[str, Any]]:
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
        rows = await conn.fetch(query)
        assignments = [dict(row) for row in rows]

        # 部署ごとにツリー構築
        tree: List[Dict[str, Any]] = []

        def find_or_create(node_list, name, node_type) -> Dict[str, Any]:
            # 既存ノードを探す
            node = next((n for n in node_list if n["name"] == name), None)
            if not node:
                node = {"name": name, "type": node_type, "children": []}
                node_list.append(node)
            return node

        for a in assignments:
            # department
            dept_node = find_or_create(tree, a["department_name"], "department")
            
            # section階層: 親セクションがある場合は親の下に配置
            section_node = find_or_create(dept_node["children"], a["section_name"], "section")
            
            # position
            pos_name = a["position_name"] or "役職不明"
            pos_node = find_or_create(section_node["children"], pos_name, "position")
            
            # employees 配列に追加
            if "employees" not in pos_node:
                pos_node["employees"] = []
            pos_node["employees"].append({
                "id": a["employee_id"],
                "name": a["employee_name"],
                "position": pos_name
            })

        return tree

    finally:
        await release_connection(conn)
