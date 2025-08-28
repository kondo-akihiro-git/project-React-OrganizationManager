# backend/api/service/assignment.py
from typing import List, Dict, Any
from db.connection.connection import get_connection, release_connection

async def get_sales_assignment() -> List[Dict[str, Any]]:
    # データベース接続を取得
    connection = await get_connection()
    try:
        # ============================
        # 1. セクション情報を取得
        # ============================
        section_rows = await connection.fetch("SELECT id, name, parent_id FROM sales_section;")
        all_sections: List[Dict[str, Any]] = [dict(row) for row in section_rows]

        # セクションをIDで参照できる辞書を作成
        section_by_id: Dict[int, Dict[str, Any]] = {}
        for section in all_sections:
            section_by_id[section["id"]] = {
                "section_id": section["id"],
                "section_name": section["name"],
                "children": [],   # サブセクションを入れるためのリスト
                "employees": []   # 直下の社員を入れるためのリスト
            }

        # 親子関係を設定
        root_sections: List[Dict[str, Any]] = []
        for section in all_sections:
            parent_id = section["parent_id"]
            if parent_id:
                # 親セクションがある場合は親のchildrenに追加
                section_by_id[parent_id]["children"].append(section_by_id[section["id"]])
            else:
                # 親がいない場合は最上位セクションとしてrootに追加
                root_sections.append(section_by_id[section["id"]])

        # ============================
        # 2. 役職情報を取得
        # ============================
        position_rows = await connection.fetch("SELECT id, name, role FROM sales_position;")
        position_by_id: Dict[int, Dict[str, str]] = {}
        for row in position_rows:
            position_by_id[row["id"]] = {"name": row["name"], "role": row["role"]}

        # ============================
        # 3. 社員の配置情報を取得
        # ============================
        query = """
        SELECT
            a.employee_id,
            e.name AS employee_name,
            a.section_id,
            a.position_id,
            a.manager_id,
            a.submanager_id,
            a.leader_id
        FROM sales_assignment a
        JOIN sales_employee e ON a.employee_id = e.id
        ORDER BY a.id;
        """
        employee_rows = await connection.fetch(query)
        all_employee_assignments: List[Dict[str, Any]] = [dict(row) for row in employee_rows]

        # ============================
        # 4. セクションごとに社員を整理
        # ============================
        for section_id, section_info in section_by_id.items():
            # そのセクションに所属する社員だけを抽出
            employees_in_this_section = [
                e for e in all_employee_assignments if e["section_id"] == section_id
            ]

            # 社員IDをキーにした辞書を作成（検索用）
            employee_by_id: Dict[int, Dict[str, Any]] = {}
            for employee_assignment in employees_in_this_section:
                employee_id = employee_assignment["employee_id"]
                employee_node = {
                    "employee_id": employee_id,
                    "employee_name": employee_assignment["employee_name"],
                    "position": position_by_id[employee_assignment["position_id"]]["name"],
                    "role": position_by_id[employee_assignment["position_id"]]["role"],
                    "children": [],  # サブマネージャーやリーダーの下位社員
                    "employees": []  # リーダーの下のメンバー
                }
                employee_by_id[employee_id] = employee_node

            # ============================
            # 5. 従属関係を設定
            # ============================

            for employee_assignment in employees_in_this_section:
                current_employee_id = employee_assignment["employee_id"]
                current_node = employee_by_id[current_employee_id]

                leader_id = employee_assignment["leader_id"]
                submanager_id = employee_assignment["submanager_id"]
                manager_id = employee_assignment["manager_id"]

                # 1. リーダー直属メンバーはリーダーの employees の先頭に追加
                if leader_id and leader_id in employee_by_id:
                    employee_by_id[leader_id]["employees"].insert(0, current_node)
                    continue

                # 2. サブマネージャー直属メンバーはサブマネの children の先頭に追加
                if submanager_id and submanager_id in employee_by_id:
                    employee_by_id[submanager_id]["children"].insert(0, current_node)
                    continue

                # 3. マネージャー直属メンバーも children の先頭に追加
                if manager_id and manager_id in employee_by_id:
                    employee_by_id[manager_id]["children"].insert(0, current_node)
                    continue

                # 4. 上司がいない社員はセクション直下に追加
                section_info["employees"].append(current_node)

        # ============================
        # 6. 完成したセクションツリーを返却
        # ============================
        return root_sections

    finally:
        # 接続は必ず解放
        await release_connection(connection)
