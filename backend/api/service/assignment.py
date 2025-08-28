# backend/api/service/assignment.py
import json
from db.connection.connection import get_connection, release_connection
from typing import List, Dict, Any

# ---------------------------
# JSONファイルを読み込む処理
# ---------------------------

# 役職マスタを読み込み
# POSITION_DICTは、役職IDをキーにして名前とレベルを取得できる辞書
with open("db/json/sales_position.json", "r", encoding="utf-8") as f:
    positions = json.load(f)  # JSONをリストとして読み込む
POSITION_DICT = {}
for p in positions:
    # levelがなければ "position_4" に設定
    level = p.get("level", "position_4")
    POSITION_DICT[p["id"]] = {"name": p["name"], "level": level}

# 部署マスタを読み込み
with open("db/json/all_department.json", "r", encoding="utf-8") as f:
    departments = json.load(f)
DEPT_DICT = {}
for d in departments:
    DEPT_DICT[d["id"]] = d["name"]

# 親セクションを読み込み
with open("db/json/sales_parent_section.json", "r", encoding="utf-8") as f:
    parent_sections = json.load(f)
PARENT_SECTION_DICT = {}
for s in parent_sections:
    PARENT_SECTION_DICT[s["id"]] = s["name"]

# 子セクションを読み込み
with open("db/json/sales_child_section.json", "r", encoding="utf-8") as f:
    child_sections = json.load(f)
CHILD_SECTION_DICT = {}
for s in child_sections:
    # 子セクションの名前と親IDを保存
    CHILD_SECTION_DICT[s["id"]] = {"name": s["name"], "parent_id": s.get("parent_id")}

# ---------------------------
# メイン関数
# ---------------------------
async def get_sales_assignment() -> List[Dict[str, Any]]:
    # データベース接続を取得
    conn = await get_connection()
    try:
        # sales_assignmentとemployeeを結合して全員の情報を取得
        query = """
        SELECT
            a.id AS assignment_id,
            e.id AS employee_id,
            e.name AS employee_name,
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
        rows = await conn.fetch(query)  # データを取得
        assignments = []
        for row in rows:
            # rowを辞書型に変換
            assignments.append(dict(row))

        # ---------------------------
        # 社員IDと名前の対応表を作る
        # これは従属情報を表示するときに名前を引くため
        # ---------------------------
        emp_rows = await conn.fetch("SELECT id, name FROM employee;")
        EMP_DICT = {}
        for r in emp_rows:
            EMP_DICT[r["id"]] = r["name"]

        # ---------------------------
        # 結果を格納するリスト
        # ---------------------------
        result: List[Dict[str, Any]] = []

        for record in assignments:
            # 部署名を取得
            dept_name = "営業部"  # 今回は全員営業部なので固定

            # 親セクション名を取得
            if record["sales_parent_section_id"] in PARENT_SECTION_DICT:
                section_parent_name = PARENT_SECTION_DICT[record["sales_parent_section_id"]]
            else:
                section_parent_name = "不明"

            # 子セクション名を取得（NULLの場合はNone）
            if record["sales_child_section_id"] and record["sales_child_section_id"] in CHILD_SECTION_DICT:
                section_child_name = CHILD_SECTION_DICT[record["sales_child_section_id"]]["name"]
            else:
                section_child_name = None

            # 役職名を取得
            if record["sales_position_id"] in POSITION_DICT:
                pos_name = POSITION_DICT[record["sales_position_id"]]["name"]
            else:
                pos_name = "役職不明"

            # ---------------------------
            # 1人分の社員情報を辞書にまとめる
            # ---------------------------
            emp_node = {
                "employee_id": record["employee_id"],
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

            # 結果リストに追加
            result.append(emp_node)

        # 完成したリストを返す
        return result

    finally:
        # 必ず接続を解放
        await release_connection(conn)
