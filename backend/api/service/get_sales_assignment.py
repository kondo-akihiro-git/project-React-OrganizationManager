# backend/api/service/get_sales_assignment.py
from typing import List, Dict, Any
from db.connection.connection import get_connection, release_connection

async def get_sales_assignment() -> List[Dict[str, Any]]:
    """
    組織構造を取得してツリー形式に整形して返す関数。
    この関数は、データベースから営業組織の情報を取得し、指定された形式のJSONレスポンスを構築します。
    「〜なし」ノード（例: 課長なし、係なし、係長なし、主任なし）はDBにexists: falseとして保存されており、
    これらも含めて「課 → 課長 → 係 → 係長 → 主任 → メンバー」の階層構造を返します。

    返却形式（概略）:
    [
      {
        "id": 整数,               # 課や人のID（DBで一意、exists: falseでも割り当て済み）
        "name": "文字列",         # 課や人の名前（exists: falseの場合は空文字""）
        "title": "課" | "課長" | "係" | "係長" | "主任" | "メンバー" | "副主任",  # 役割を示す
        "exists": true | false,   # そのノードが実際に存在するか（DBのexistsカラムを反映）
        "children": [             # 子ノードのリスト（再帰的に同じ構造）
          {
            "id": ...,
            "name": "...",
            "title": "...",
            "exists": ...,
            "children": [...]
          },
          ...
        ]
      },
      ...
    ]
    """
    # データベース接続を取得（データベースと通信するための準備）
    connection = await get_connection()
    try:
        # ======================================================
        # 1) 課（department）を取得して、辞書に整形
        #    課は必ずexists: trueなので、そのままツリーのルートに
        # ======================================================
        # *** 修正: existsカラムをSELECTに追加 ***
        department_rows = await connection.fetch("SELECT id, name, exists FROM sales_department ORDER BY id;")
        department_records: List[Dict[str, Any]] = [
            {"id": row["id"], "name": row["name"], "title": "課", "exists": row["exists"], "children": []}
            for row in department_rows
        ]
        department_by_id: Dict[int, Dict[str, Any]] = {
            department["id"]: department for department in department_records
        }

        # ======================================================
        # 2) 課長（manager）を取得して、課に紐付け
        #    exists: false（例: 課長なし）もDBから取得済み
        # ======================================================
        # *** 修正: existsカラムをSELECTに追加、ダミーノード追加ロジックを削除 ***
        manager_rows = await connection.fetch("SELECT id, name, department_id, exists FROM sales_manager;")
        manager_records: List[Dict[str, Any]] = [dict(row) for row in manager_rows]
        manager_by_id: Dict[int, Dict[str, Any]] = {
            manager["id"]: {
                "id": manager["id"],
                "name": manager["name"],
                "title": "課長",
                "exists": manager["exists"],
                "children": []
            }
            for manager in manager_records
        }

        # 各課に課長を追加
        for department_id, department in department_by_id.items():
            matching_managers = [m for m in manager_records if m["department_id"] == department_id]
            for manager in matching_managers:
                department["children"].append(manager_by_id[manager["id"]])
            # *** 修正: ダミーノード追加を削除（DBにexists: falseで存在） ***

        # ======================================================
        # 3) 係（team）を取得して、課長に紐付け
        #    exists: false（例: 係なし）もDBから取得済み
        # ======================================================
        # *** 修正: existsカラムをSELECTに追加、ダミーノード追加ロジックを削除 ***
        team_rows = await connection.fetch("SELECT id, name, department_id, manager_id, exists FROM sales_team;")
        team_records: List[Dict[str, Any]] = [dict(row) for row in team_rows]
        team_by_id: Dict[int, Dict[str, Any]] = {
            team["id"]: {
                "id": team["id"],
                "name": team["name"],
                "title": "係",
                "exists": team["exists"],
                "children": []
            }
            for team in team_records
        }

        # 係を課長に追加
        for team in team_records:
            team_id = team["id"]
            team_manager_id = team.get("manager_id")
            team_department_id = team["department_id"]
            target_manager = None
            if team_manager_id and team_manager_id in manager_by_id:
                target_manager = manager_by_id[team_manager_id]
            else:
                for department in department_by_id.values():
                    if department["id"] == team_department_id:
                        target_manager = department["children"][0]  # 課長ノード（exists: false含む）
                        break
                else:
                    # 万が一課が見つからない場合（エラー防止）
                    department_by_id[team_department_id] = {
                        "id": team_department_id,
                        "name": "(不明な課)",
                        "title": "課",
                        "exists": True,
                        "children": [{
                            "id": -1,  # *** 修正: 仮のIDでエラー防止 ***
                            "name": "",
                            "title": "課長",
                            "exists": False,
                            "children": []
                        }]
                    }
                    target_manager = department_by_id[team_department_id]["children"][0]
            target_manager["children"].append(team_by_id[team_id])
            # *** 修正: ダミー係ノード追加を削除（DBにexists: falseで存在） ***

        # ======================================================
        # 4) 係長（sub_manager）を取得して、係に紐付け
        #    exists: false（例: 係長なし）もDBから取得済み
        # ======================================================
        # *** 修正: existsカラムをSELECTに追加、ダミーノード追加ロジックを削除 ***
        sub_manager_rows = await connection.fetch(
            "SELECT id, name, team_id, manager_id, department_id, exists FROM sales_sub_manager;"
        )
        sub_manager_records: List[Dict[str, Any]] = [dict(row) for row in sub_manager_rows]
        sub_manager_by_id: Dict[int, Dict[str, Any]] = {
            sub_manager["id"]: {
                "id": sub_manager["id"],
                "name": sub_manager["name"],
                "title": "係長",
                "exists": sub_manager["exists"],
                "children": []
            }
            for sub_manager in sub_manager_records
        }

        # 係長を係に追加
        for sub_manager in sub_manager_records:
            target_parent = None
            team_id_of_sub_manager = sub_manager.get("team_id")
            if team_id_of_sub_manager and team_id_of_sub_manager in team_by_id:
                target_parent = team_by_id[team_id_of_sub_manager]
            else:
                manager_id_of_sub_manager = sub_manager.get("manager_id")
                department_id_of_sub_manager = sub_manager.get("department_id")
                if manager_id_of_sub_manager and manager_id_of_sub_manager in manager_by_id:
                    target_parent = manager_by_id[manager_id_of_sub_manager]
                else:
                    for department in department_by_id.values():
                        if department["id"] == department_id_of_sub_manager:
                            target_parent = department["children"][0]  # 課長ノード
                            break
                    else:
                        department_by_id[department_id_of_sub_manager] = {
                            "id": department_id_of_sub_manager,
                            "name": "(不明な課)",
                            "title": "課",
                            "exists": True,
                            "children": [{
                                "id": -1,
                                "name": "",
                                "title": "課長",
                                "exists": False,
                                "children": []
                            }]
                        }
                        target_parent = department_by_id[department_id_of_sub_manager]["children"][0]
                # *** 修正: ダミー係ノード追加を削除（DBにexists: falseで存在） ***
            target_parent["children"].append(sub_manager_by_id[sub_manager["id"]])
            # *** 修正: ダミー係長ノード追加を削除（DBにexists: falseで存在） ***

        # ======================================================
        # 5) 主任（leader）を取得して、係長に紐付け
        #    exists: false（例: 主任なし）もDBから取得済み
        # ======================================================
        # *** 修正: existsカラムをSELECTに追加、ダミーノード追加ロジックを削除 ***
        leader_rows = await connection.fetch(
            "SELECT id, name, sub_manager_id, team_id, manager_id, department_id, exists FROM sales_leader;"
        )
        leader_records: List[Dict[str, Any]] = [dict(row) for row in leader_rows]
        leader_by_id: Dict[int, Dict[str, Any]] = {
            leader["id"]: {
                "id": leader["id"],
                "name": leader["name"],
                "title": "主任",
                "exists": leader["exists"],
                "children": []
            }
            for leader in leader_records
        }

        # 主任を係長に追加
        for leader in leader_records:
            target_parent = None
            sub_manager_id_of_leader = leader.get("sub_manager_id")
            if sub_manager_id_of_leader and sub_manager_id_of_leader in sub_manager_by_id:
                target_parent = sub_manager_by_id[sub_manager_id_of_leader]
            else:
                team_id_of_leader = leader.get("team_id")
                if team_id_of_leader and team_id_of_leader in team_by_id:
                    target_parent = team_by_id[team_id_of_leader]
                else:
                    manager_id_of_leader = leader.get("manager_id")
                    department_id_of_leader = leader.get("department_id")
                    if manager_id_of_leader and manager_id_of_leader in manager_by_id:
                        target_parent = manager_by_id[manager_id_of_leader]
                    else:
                        for department in department_by_id.values():
                            if department["id"] == department_id_of_leader:
                                target_parent = department["children"][0]  # 課長ノード
                                break
                        else:
                            department_by_id[department_id_of_leader] = {
                                "id": department_id_of_leader,
                                "name": "(不明な課)",
                                "title": "課",
                                "exists": True,
                                "children": [{
                                    "id": -1,
                                    "name": "",
                                    "title": "課長",
                                    "exists": False,
                                    "children": []
                                }]
                            }
                            target_parent = department_by_id[department_id_of_leader]["children"][0]
                    # *** 修正: ダミー係・係長ノード追加を削除（DBにexists: falseで存在） ***
                # *** 修正: ダミー係長ノード追加を削除（DBにexists: falseで存在） ***
            target_parent["children"].append(leader_by_id[leader["id"]])
            # *** 修正: ダミー主任ノード追加を削除（DBにexists: falseで存在） ***

        # ======================================================
        # 6) メンバー（sales_member）を取得して、主任に紐付け
        #    メンバーは「〜なし」なしなので、そのまま追加
        # ======================================================
        member_rows = await connection.fetch(
            "SELECT id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id FROM sales_member;"
        )
        member_records: List[Dict[str, Any]] = [dict(row) for row in member_rows]

        # メンバーを適切な親に追加
        for member in member_records:
            member_node = {
                "id": member["id"],
                "name": member["name"],
                "title": member.get("title", "メンバー"),
                "exists": True,  # メンバーは「〜なし」なし
                "children": []
            }
            parent_for_member = None
            leader_id_for_member = member.get("leader_id")
            if leader_id_for_member and leader_id_for_member in leader_by_id:
                parent_for_member = leader_by_id[leader_id_for_member]
            else:
                sub_manager_id_for_member = member.get("sub_manager_id")
                if sub_manager_id_for_member and sub_manager_id_for_member in sub_manager_by_id:
                    parent_for_member = sub_manager_by_id[sub_manager_id_for_member]
                else:
                    team_id_for_member = member.get("team_id")
                    if team_id_for_member and team_id_for_member in team_by_id:
                        parent_for_member = team_by_id[team_id_for_member]
                    else:
                        manager_id_for_member = member.get("manager_id")
                        if manager_id_for_member and manager_id_for_member in manager_by_id:
                            parent_for_member = manager_by_id[manager_id_for_member]
                        else:
                            department_id_for_member = member.get("department_id")
                            for department in department_by_id.values():
                                if department["id"] == department_id_for_member:
                                    parent_for_member = department["children"][0]  # 課長ノード
                                    break
                            else:
                                department_by_id[department_id_for_member] = {
                                    "id": department_id_for_member,
                                    "name": "(不明な課)",
                                    "title": "課",
                                    "exists": True,
                                    "children": [{
                                        "id": -1,
                                        "name": "",
                                        "title": "課長",
                                        "exists": False,
                                        "children": []
                                    }]
                                }
                                parent_for_member = department_by_id[department_id_for_member]["children"][0]
                        # *** 修正: ダミー係・係長・主任ノード追加を削除（DBにexists: falseで存在） ***
            parent_for_member["children"].append(member_node)

        # ======================================================
        # 7) 最終的な結果を返す
        # ======================================================
        final_result = list(department_by_id.values())
        return final_result

    finally:
        # データベース接続を解放（必ず実行）
        await release_connection(connection)