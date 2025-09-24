# backend/api/service/get_sales_assignment.py
from typing import List, Dict, Any
from db.connection.connection import get_connection, release_connection

async def get_sales_assignment() -> List[Dict[str, Any]]:
    """
    組織構造を取得してツリー形式に整形して返す関数。
    この関数は、データベースから営業組織の情報を取得し、指定された形式のJSONレスポンスを構築します。
    特に、存在しない役職（例: 課長、係、係長、主任）も明示的に含め、"exists": false として返します。
    すべての課は「課 → 課長 → 係 → 係長 → 主任 → メンバー」の階層構造を保持します。

    返却形式（概略）:
    [
      {
        "id": 整数またはnull,      # 課や人のID（存在しない場合はnull）
        "name": "文字列",          # 課や人の名前（存在しない場合は空文字""）
        "title": "課" | "課長" | "係" | "係長" | "主任" | "メンバー" | "副主任",  # 役割を示す
        "exists": true | false,    # そのノードが実際に存在するか（存在しない場合はfalse）
        "children": [              # 子ノードのリスト（再帰的に同じ構造）
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
        #    課は必ず存在するので、"exists": true を設定
        # ======================================================
        # 課のデータをデータベースから取得（ID順に並べ替え）
        department_rows = await connection.fetch("SELECT id, name FROM sales_department ORDER BY id;")
        # 取得したデータをPythonの辞書形式に変換し、"title" と "children" を追加
        department_records: List[Dict[str, Any]] = [
            {"id": row["id"], "name": row["name"], "title": "課", "exists": True, "children": []}
            for row in department_rows
        ]
        # IDをキーにして、課をすぐに見つけられるように辞書を作成
        department_by_id: Dict[int, Dict[str, Any]] = {
            department["id"]: department for department in department_records
        }

        # ======================================================
        # 2) 課長（manager）を取得して、課に紐付け
        #    課長がいない課には "exists": false のダミーノードを追加
        # ======================================================
        # 課長のデータをデータベースから取得
        manager_rows = await connection.fetch("SELECT id, name, department_id FROM sales_manager;")
        manager_records: List[Dict[str, Any]] = [dict(row) for row in manager_rows]
        # 課長をIDで検索できるように辞書を作成
        manager_by_id: Dict[int, Dict[str, Any]] = {
            manager["id"]: {
                "id": manager["id"],
                "name": manager["name"],
                "title": "課長",
                "exists": True,
                "children": []
            }
            for manager in manager_records
        }

        # 各課に対して課長を処理
        for department_id, department in department_by_id.items():
            # その課に所属する課長を探す
            matching_managers = [m for m in manager_records if m["department_id"] == department_id]
            if matching_managers:
                # 課長が存在する場合、その課長をchildrenに追加
                for manager in matching_managers:
                    department["children"].append(manager_by_id[manager["id"]])
            else:
                # 課長が存在しない場合、ダミーの課長ノードを追加
                department["children"].append({
                    "id": None,
                    "name": "",
                    "title": "課長",
                    "exists": False,
                    "children": []
                })

        # ======================================================
        # 3) 係（team）を取得して、課長に紐付け
        #    係がない場合でも、課長の下にダミーの係ノードを追加
        # ======================================================
        # 係のデータをデータベースから取得
        team_rows = await connection.fetch("SELECT id, name, department_id, manager_id FROM sales_team;")
        team_records: List[Dict[str, Any]] = [dict(row) for row in team_rows]
        # 係をIDで検索できるように辞書を作成
        team_by_id: Dict[int, Dict[str, Any]] = {
            team["id"]: {
                "id": team["id"],
                "name": team["name"],
                "title": "係",
                "exists": True,
                "children": []
            }
            for team in team_records
        }

        # 係を課長ノードに追加
        for team in team_records:
            team_id = team["id"]
            team_manager_id = team.get("manager_id")
            team_department_id = team.get("department_id")

            # 課長を探す
            target_manager = None
            if team_manager_id and team_manager_id in manager_by_id:
                target_manager = manager_by_id[team_manager_id]
            else:
                # 課長がいない場合、課の課長ノード（存在しない場合も含む）を見つける
                for department in department_by_id.values():
                    if department["id"] == team_department_id:
                        target_manager = department["children"][0]  # 課長ノードは必ず1つ存在
                        break
                else:
                    # 万が一課が見つからない場合（エラー防止）
                    department_by_id[team_department_id] = {
                        "id": team_department_id,
                        "name": "(不明な課)",
                        "title": "課",
                        "exists": True,
                        "children": [{
                            "id": None,
                            "name": "",
                            "title": "課長",
                            "exists": False,
                            "children": []
                        }]
                    }
                    target_manager = department_by_id[team_department_id]["children"][0]

            # 課長のchildrenに係を追加
            target_manager["children"].append(team_by_id[team_id])

        # 課長ノードに係がない場合、ダミーの係ノードを追加
        for department in department_by_id.values():
            for manager_node in department["children"]:
                if not manager_node["children"]:
                    manager_node["children"].append({
                        "id": None,
                        "name": "",
                        "title": "係",
                        "exists": False,
                        "children": []
                    })

        # ======================================================
        # 4) 係長（sub_manager）を取得して、係に紐付け
        #    係長がいない係には "exists": false のダミーノードを追加
        # ======================================================
        # 係長のデータをデータベースから取得
        sub_manager_rows = await connection.fetch(
            "SELECT id, name, team_id, manager_id, department_id FROM sales_sub_manager;"
        )
        sub_manager_records: List[Dict[str, Any]] = [dict(row) for row in sub_manager_rows]
        # 係長をIDで検索できるように辞書を作成
        sub_manager_by_id: Dict[int, Dict[str, Any]] = {
            sub_manager["id"]: {
                "id": sub_manager["id"],
                "name": sub_manager["name"],
                "title": "係長",
                "exists": True,
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
                # チームがない場合、課長または課に追加
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
                        # 万が一課が見つからない場合
                        department_by_id[department_id_of_sub_manager] = {
                            "id": department_id_of_sub_manager,
                            "name": "(不明な課)",
                            "title": "課",
                            "exists": True,
                            "children": [{
                                "id": None,
                                "name": "",
                                "title": "課長",
                                "exists": False,
                                "children": []
                            }]
                        }
                        target_parent = department_by_id[department_id_of_sub_manager]["children"][0]
                # 課長の下にダミーの係ノードを追加して、そこに係長を配置
                if not target_parent["children"]:
                    target_parent["children"].append({
                        "id": None,
                        "name": "",
                        "title": "係",
                        "exists": False,
                        "children": []
                    })
                target_parent = target_parent["children"][-1]

            target_parent["children"].append(sub_manager_by_id[sub_manager["id"]])

        # 各係に係長がない場合、ダミーの係長ノードを追加
        for team in team_by_id.values():
            if not team["children"]:
                team["children"].append({
                    "id": None,
                    "name": "",
                    "title": "係長",
                    "exists": False,
                    "children": []
                })

        # 課長直下の係がない場合、ダミーの係と係長を追加（再確認）
        for department in department_by_id.values():
            for manager_node in department["children"]:
                for team_node in manager_node["children"]:
                    if team_node["exists"] and not team_node["children"]:
                        team_node["children"].append({
                            "id": None,
                            "name": "",
                            "title": "係長",
                            "exists": False,
                            "children": []
                        })

        # ======================================================
        # 5) 主任（leader）を取得して、係長に紐付け
        #    主任がいない係長には "exists": false のダミーノードを追加
        # ======================================================
        # 主任のデータをデータベースから取得
        leader_rows = await connection.fetch(
            "SELECT id, name, sub_manager_id, team_id, manager_id, department_id FROM sales_leader;"
        )
        leader_records: List[Dict[str, Any]] = [dict(row) for row in leader_rows]
        # 主任をIDで検索できるように辞書を作成
        leader_by_id: Dict[int, Dict[str, Any]] = {
            leader["id"]: {
                "id": leader["id"],
                "name": leader["name"],
                "title": "主任",
                "exists": True,
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
                # 係長がない場合、チーム、課長、または課に追加
                team_id_of_leader = leader.get("team_id")
                if team_id_of_leader and team_id_of_leader in team_by_id:
                    target_parent = team_by_id[team_id_of_leader]
                    # チームに係長ノードを追加
                    if not target_parent["children"]:
                        target_parent["children"].append({
                            "id": None,
                            "name": "",
                            "title": "係長",
                            "exists": False,
                            "children": []
                        })
                    target_parent = target_parent["children"][-1]
                else:
                    manager_id_of_leader = leader.get("manager_id")
                    department_id_of_leader = leader.get("department_id")
                    if manager_id_of_leader and manager_id_of_leader in manager_by_id:
                        target_parent = manager_by_id[manager_id_of_leader]
                        # 課長に係ノードを追加
                        if not target_parent["children"]:
                            target_parent["children"].append({
                                "id": None,
                                "name": "",
                                "title": "係",
                                "exists": False,
                                "children": []
                            })
                        target_parent = target_parent["children"][-1]
                        # 係に係長ノードを追加
                        if not target_parent["children"]:
                            target_parent["children"].append({
                                "id": None,
                                "name": "",
                                "title": "係長",
                                "exists": False,
                                "children": []
                            })
                        target_parent = target_parent["children"][-1]
                    else:
                        # 課に追加
                        department_id_of_leader = leader.get("department_id")
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
                                    "id": None,
                                    "name": "",
                                    "title": "課長",
                                    "exists": False,
                                    "children": []
                                }]
                            }
                            target_parent = department_by_id[department_id_of_leader]["children"][0]
                        # 課長に係ノードを追加
                        if not target_parent["children"]:
                            target_parent["children"].append({
                                "id": None,
                                "name": "",
                                "title": "係",
                                "exists": False,
                                "children": []
                            })
                        target_parent = target_parent["children"][-1]
                        # 係に係長ノードを追加
                        if not target_parent["children"]:
                            target_parent["children"].append({
                                "id": None,
                                "name": "",
                                "title": "係長",
                                "exists": False,
                                "children": []
                            })
                        target_parent = target_parent["children"][-1]

            target_parent["children"].append(leader_by_id[leader["id"]])

        # 各係長に主任がない場合、ダミーの主任ノードを追加
        for team in team_by_id.values():
            for sub_manager in team["children"]:
                if not sub_manager["children"]:
                    sub_manager["children"].append({
                        "id": None,
                        "name": "",
                        "title": "主任",
                        "exists": False,
                        "children": []
                    })

        # ダミー係の係長にも主任ノードを追加
        for department in department_by_id.values():
            for manager_node in department["children"]:
                for team_node in manager_node["children"]:
                    for sub_manager_node in team_node["children"]:
                        if not sub_manager_node["children"]:
                            sub_manager_node["children"].append({
                                "id": None,
                                "name": "",
                                "title": "主任",
                                "exists": False,
                                "children": []
                            })

        # ======================================================
        # 6) メンバー（sales_member）を取得して、主任に紐付け
        #    主任がいない場合は、係長の下に配置
        # ======================================================
        # メンバーのデータをデータベースから取得
        member_rows = await connection.fetch(
            "SELECT id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id FROM sales_member;"
        )
        member_records: List[Dict[str, Any]] = [dict(row) for row in member_rows]

        # メンバーを適切な親に追加
        for member in member_records:
            # メンバーのノードを作成
            member_node = {
                "id": member["id"],
                "name": member["name"],
                "title": member.get("title", "メンバー"),
                "exists": True,
                "children": []
            }

            # 親を優先順位で探す
            parent_for_member = None
            leader_id_for_member = member.get("leader_id")
            if leader_id_for_member and leader_id_for_member in leader_by_id:
                parent_for_member = leader_by_id[leader_id_for_member]
            else:
                sub_manager_id_for_member = member.get("sub_manager_id")
                if sub_manager_id_for_member and sub_manager_id_for_member in sub_manager_by_id:
                    parent_for_member = sub_manager_by_id[sub_manager_id_for_member]
                    # 係長に主任ノードを追加
                    if not parent_for_member["children"]:
                        parent_for_member["children"].append({
                            "id": None,
                            "name": "",
                            "title": "主任",
                            "exists": False,
                            "children": []
                        })
                    parent_for_member = parent_for_member["children"][-1]
                else:
                    team_id_for_member = member.get("team_id")
                    if team_id_for_member and team_id_for_member in team_by_id:
                        parent_for_member = team_by_id[team_id_for_member]
                        # チームに係長ノードを追加
                        if not parent_for_member["children"]:
                            parent_for_member["children"].append({
                                "id": None,
                                "name": "",
                                "title": "係長",
                                "exists": False,
                                "children": []
                            })
                        parent_for_member = parent_for_member["children"][-1]
                        # 係長に主任ノードを追加
                        if not parent_for_member["children"]:
                            parent_for_member["children"].append({
                                "id": None,
                                "name": "",
                                "title": "主任",
                                "exists": False,
                                "children": []
                            })
                        parent_for_member = parent_for_member["children"][-1]
                    else:
                        manager_id_for_member = member.get("manager_id")
                        if manager_id_for_member and manager_id_for_member in manager_by_id:
                            parent_for_member = manager_by_id[manager_id_for_member]
                            # 課長に係ノードを追加
                            if not parent_for_member["children"]:
                                parent_for_member["children"].append({
                                    "id": None,
                                    "name": "",
                                    "title": "係",
                                    "exists": False,
                                    "children": []
                                })
                            parent_for_member = parent_for_member["children"][-1]
                            # 係に係長ノードを追加
                            if not parent_for_member["children"]:
                                parent_for_member["children"].append({
                                    "id": None,
                                    "name": "",
                                    "title": "係長",
                                    "exists": False,
                                    "children": []
                                })
                            parent_for_member = parent_for_member["children"][-1]
                            # 係長に主任ノードを追加
                            if not parent_for_member["children"]:
                                parent_for_member["children"].append({
                                    "id": None,
                                    "name": "",
                                    "title": "主任",
                                    "exists": False,
                                    "children": []
                                })
                            parent_for_member = parent_for_member["children"][-1]
                        else:
                            # 最終的に課の課長ノードに追加
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
                                        "id": None,
                                        "name": "",
                                        "title": "課長",
                                        "exists": False,
                                        "children": []
                                    }]
                                }
                                parent_for_member = department_by_id[department_id_for_member]["children"][0]
                            # 課長に係ノードを追加
                            if not parent_for_member["children"]:
                                parent_for_member["children"].append({
                                    "id": None,
                                    "name": "",
                                    "title": "係",
                                    "exists": False,
                                    "children": []
                                })
                            parent_for_member = parent_for_member["children"][-1]
                            # 係に係長ノードを追加
                            if not parent_for_member["children"]:
                                parent_for_member["children"].append({
                                    "id": None,
                                    "name": "",
                                    "title": "係長",
                                    "exists": False,
                                    "children": []
                                })
                            parent_for_member = parent_for_member["children"][-1]
                            # 係長に主任ノードを追加
                            if not parent_for_member["children"]:
                                parent_for_member["children"].append({
                                    "id": None,
                                    "name": "",
                                    "title": "主任",
                                    "exists": False,
                                    "children": []
                                })
                            parent_for_member = parent_for_member["children"][-1]

            parent_for_member["children"].append(member_node)

        # ======================================================
        # 7) 最終的な結果を返す
        # ======================================================
        # 課ごとのデータをリスト形式で返す
        final_result = list(department_by_id.values())
        return final_result

    finally:
        # データベース接続を解放（必ず実行）
        await release_connection(connection)