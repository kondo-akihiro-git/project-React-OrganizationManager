# backend/api/service/assignment.py
from typing import List, Dict, Any
from db.connection.connection import get_connection, release_connection

async def get_sales_assignment() -> List[Dict[str, Any]]:
    """
    組織構造を取得してツリー形式に整形して返す関数。

    返却形式（概略）:
    [
      {
        "id": ...,
        "name": "...",          # 課名
        "children": [
          {
            "id": ..., 
            "name": "...",      # 課長など or チーム名
            "title": "課長",     # 課長・係長・主任などの役職名（該当する場合のみ）
            "children": [
              ... (さらに入れ子)
            ]
          },
          ...
        ]
      },
      ...
    ]
    """
    # DB 接続を取得
    connection = await get_connection()
    try:
        # ======================================================
        # 1) 課（department）を取得して、辞書に整形します
        # ======================================================
        # SQL を実行して、結果行を取得します
        department_rows = await connection.fetch("SELECT id, name FROM sales_department ORDER BY id;")

        # DBの行オブジェクトを普通の dict に変換して扱いやすくします
        department_records: List[Dict[str, Any]] = [dict(row) for row in department_rows]

        # id をキーにして lookup 用辞書を作ります。
        # ここで各要素に 'children' を初期化しておくと、後で子要素を append できます。
        department_by_id: Dict[int, Dict[str, Any]] = {
            department["id"]: {**department, "children": []}
            for department in department_records
        }

        # ======================================================
        # 2) 課長（manager）を取得して、課に紐付けます
        #    課長には 'title' = "課長" を追加します（表示用）
        # ======================================================
        manager_rows = await connection.fetch("SELECT id, name, department_id FROM sales_manager;")
        manager_records: List[Dict[str, Any]] = [dict(row) for row in manager_rows]

        # manager_by_id に 'title'（課長）と children を付与して格納
        manager_by_id: Dict[int, Dict[str, Any]] = {
            manager["id"]: {**manager, "title": "課長", "children": []}
            for manager in manager_records
        }

        # 各課長を所属する課（department）の children に追加します
        for manager in manager_records:
            department_id_of_manager = manager.get("department_id")
            if department_id_of_manager in department_by_id:
                department_by_id[department_id_of_manager]["children"].append(
                    manager_by_id[manager["id"]]
                )
            else:
                # 安全対策: 所属課が見つからない場合は無視せず新しい項目を作る（極力データを失わない）
                department_by_id.setdefault(
                    department_id_of_manager,
                    {"id": department_id_of_manager, "name": "(不明な課)", "children": []}
                )["children"].append(manager_by_id[manager["id"]])

        # ======================================================
        # 3) 係（team）を取得して、課長または課に紐付けます
        #    team は組織単位（title は付けない）
        # ======================================================
        team_rows = await connection.fetch("SELECT id, name, department_id, manager_id FROM sales_team;")
        team_records: List[Dict[str, Any]] = [dict(row) for row in team_rows]

        # team_by_id に children を初期化
        team_by_id: Dict[int, Dict[str, Any]] = {
            team["id"]: {**team, "children": []}
            for team in team_records
        }

        # team を、課長（manager）がいるならその manager の子に、いなければ department の直下に入れる
        for team in team_records:
            team_id = team["id"]
            team_manager_id = team.get("manager_id")
            team_department_id = team.get("department_id")

            if team_manager_id and team_manager_id in manager_by_id:
                # manager（課長）が存在すればその children に追加
                manager_by_id[team_manager_id]["children"].append(team_by_id[team_id])
            else:
                # 課長がいない場合は department の直下に追加
                if team_department_id in department_by_id:
                    department_by_id[team_department_id]["children"].append(team_by_id[team_id])
                else:
                    # 万が一 department が無ければ予備ノードを作って追加
                    department_by_id.setdefault(
                        team_department_id,
                        {"id": team_department_id, "name": "(不明な課)", "children": []}
                    )["children"].append(team_by_id[team_id])

        # ======================================================
        # 4) 係長（sub-manager）を取得して、優先順に親に紐付けます
        #    - team -> manager -> department の順で親を探す
        #    係長には 'title' = "係長" を追加します（表示用）
        # ======================================================
        sub_manager_rows = await connection.fetch(
            "SELECT id, name, team_id, manager_id, department_id FROM sales_sub_manager;"
        )
        sub_manager_records: List[Dict[str, Any]] = [dict(row) for row in sub_manager_rows]

        # sub_manager_by_id に title と children を付与
        sub_manager_by_id: Dict[int, Dict[str, Any]] = {
            sub_manager["id"]: {**sub_manager, "title": "係長", "children": []}
            for sub_manager in sub_manager_records
        }

        # 親の決定と追加（チーム→課長→課）
        for sub_manager in sub_manager_records:
            target_parent = None

            # まず team を親として探す
            team_id_of_sub_manager = sub_manager.get("team_id")
            if team_id_of_sub_manager and team_id_of_sub_manager in team_by_id:
                target_parent = team_by_id[team_id_of_sub_manager]
            else:
                # 次に manager（課長）を親として探す
                manager_id_of_sub_manager = sub_manager.get("manager_id")
                if manager_id_of_sub_manager and manager_id_of_sub_manager in manager_by_id:
                    target_parent = manager_by_id[manager_id_of_sub_manager]
                else:
                    # 最後に department を親として使う（安全策）
                    department_id_of_sub_manager = sub_manager.get("department_id")
                    if department_id_of_sub_manager in department_by_id:
                        target_parent = department_by_id[department_id_of_sub_manager]
                    else:
                        # 見つからない場合は新規の課ノードを作ってそちらに追加
                        target_parent = department_by_id.setdefault(
                            department_id_of_sub_manager,
                            {"id": department_id_of_sub_manager, "name": "(不明な課)", "children": []}
                        )

            # 親が決まったら子要素リストに追加
            target_parent["children"].append(sub_manager_by_id[sub_manager["id"]])

        # ======================================================
        # 5) 主任（leader）を取得して、優先順に親に紐付けます
        #    - sub_manager -> team -> manager -> department の優先順位
        #    主任には 'title' = "主任" を追加します（表示用）
        # ======================================================
        leader_rows = await connection.fetch(
            "SELECT id, name, sub_manager_id, team_id, manager_id, department_id FROM sales_leader;"
        )
        leader_records: List[Dict[str, Any]] = [dict(row) for row in leader_rows]

        # leader_by_id に title と children を付与
        leader_by_id: Dict[int, Dict[str, Any]] = {
            leader["id"]: {**leader, "title": "主任", "children": []}
            for leader in leader_records
        }

        # 親の優先付けで追加
        for leader in leader_records:
            parent_for_leader = None

            # 優先 1: sub_manager（係長）
            sub_manager_id_of_leader = leader.get("sub_manager_id")
            if sub_manager_id_of_leader and sub_manager_id_of_leader in sub_manager_by_id:
                parent_for_leader = sub_manager_by_id[sub_manager_id_of_leader]
            else:
                # 優先 2: team
                team_id_of_leader = leader.get("team_id")
                if team_id_of_leader and team_id_of_leader in team_by_id:
                    parent_for_leader = team_by_id[team_id_of_leader]
                else:
                    # 優先 3: manager（課長）
                    manager_id_of_leader = leader.get("manager_id")
                    if manager_id_of_leader and manager_id_of_leader in manager_by_id:
                        parent_for_leader = manager_by_id[manager_id_of_leader]
                    else:
                        # 最終: department
                        department_id_of_leader = leader.get("department_id")
                        parent_for_leader = department_by_id.setdefault(
                            department_id_of_leader,
                            {"id": department_id_of_leader, "name": "(不明な課)", "children": []}
                        )

            # 親が決まれば追加
            parent_for_leader["children"].append(leader_by_id[leader["id"]])

        # ======================================================
        # 6) メンバーを取得して、優先順位（leader -> sub_manager -> team -> manager -> department）で紐付け
        #    メンバーは DB に title カラムがある（メンバー／副主任など）が、ここではそのまま設定します
        # ======================================================
        member_rows = await connection.fetch(
            "SELECT id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id FROM sales_member;"
        )
        member_records: List[Dict[str, Any]] = [dict(row) for row in member_rows]

        for member in member_records:
            # member 用のノードを作成（children は空の配列）
            member_node = {
                "id": member["id"],
                "name": member["name"],
                # DB の title をそのまま使います（例: 'メンバー'、'副主任'）
                "title": member.get("title"),
                "children": []
            }

            # 親を優先順に探す
            parent_for_member = None
            leader_id_for_member = member.get("leader_id")
            sub_manager_id_for_member = member.get("sub_manager_id")
            team_id_for_member = member.get("team_id")
            manager_id_for_member = member.get("manager_id")
            department_id_for_member = member.get("department_id")

            if leader_id_for_member and leader_id_for_member in leader_by_id:
                parent_for_member = leader_by_id[leader_id_for_member]
            elif sub_manager_id_for_member and sub_manager_id_for_member in sub_manager_by_id:
                parent_for_member = sub_manager_by_id[sub_manager_id_for_member]
            elif team_id_for_member and team_id_for_member in team_by_id:
                parent_for_member = team_by_id[team_id_for_member]
            elif manager_id_for_member and manager_id_for_member in manager_by_id:
                parent_for_member = manager_by_id[manager_id_for_member]
            else:
                # 最後は department の直下に追加
                parent_for_member = department_by_id.setdefault(
                    department_id_for_member,
                    {"id": department_id_for_member, "name": "(不明な課)", "children": []}
                )

            # 親の children にメンバーを追加
            parent_for_member["children"].append(member_node)

        # ======================================================
        # 7) 最終的に department ごとの配列を返す
        # ======================================================
        # department_by_id の values を list にして返します
        final_result = list(department_by_id.values())
        return final_result

    finally:
        # DB 接続を解放（必ず実行されます）
        await release_connection(connection)
