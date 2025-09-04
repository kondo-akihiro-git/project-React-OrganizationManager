# backend/api/service/assignment.py
from typing import List, Dict, Any
from db.connection.connection import get_connection, release_connection

async def get_sales_assignment() -> List[Dict[str, Any]]:
    connection = await get_connection()
    try:
        # ============================
        # 1. 課取得（必ず存在）
        # ============================
        dept_rows = await connection.fetch("SELECT id, name FROM sales_department ORDER BY id;")
        departments = [dict(r) for r in dept_rows]
        dept_by_id = {d['id']: {**d, 'children': []} for d in departments}

        # ============================
        # 2. 課長取得
        # ============================
        mgr_rows = await connection.fetch("SELECT id, name, department_id FROM sales_manager;")
        managers = [dict(r) for r in mgr_rows]
        mgr_by_id = {m['id']: {**m, 'children': []} for m in managers}

        # 課長を課に紐付け
        for m in managers:
            dept_by_id[m['department_id']]['children'].append(mgr_by_id[m['id']])

        # ============================
        # 3. 係（チーム）取得
        # ============================
        team_rows = await connection.fetch("SELECT id, name, department_id, manager_id FROM sales_team;")
        teams = [dict(r) for r in team_rows]
        team_by_id = {t['id']: {**t, 'children': []} for t in teams}

        # 課長がいれば課長に、いなければ課に直接紐付け
        for t in teams:
            if t['manager_id'] and t['manager_id'] in mgr_by_id:
                mgr_by_id[t['manager_id']]['children'].append(team_by_id[t['id']])
            else:
                dept_by_id[t['department_id']]['children'].append(team_by_id[t['id']])

        # ============================
        # 4. 係長取得
        # ============================
        sub_mgr_rows = await connection.fetch(
            "SELECT id, name, team_id, manager_id, department_id FROM sales_sub_manager;"
        )
        sub_mgrs = [dict(r) for r in sub_mgr_rows]
        sub_mgr_by_id = {s['id']: {**s, 'children': []} for s in sub_mgrs}

        # 係長を親に紐付け（チーム→課長→課の順）
        for s in sub_mgrs:
            parent = None
            if s['team_id'] and s['team_id'] in team_by_id:
                parent = team_by_id[s['team_id']]
            elif s['manager_id'] and s['manager_id'] in mgr_by_id:
                parent = mgr_by_id[s['manager_id']]
            else:
                parent = dept_by_id[s['department_id']]
            parent['children'].append(sub_mgr_by_id[s['id']])

        # ============================
        # 5. 主任取得
        # ============================
        leader_rows = await connection.fetch(
            "SELECT id, name, sub_manager_id, team_id, manager_id, department_id FROM sales_leader;"
        )
        leaders = [dict(r) for r in leader_rows]
        leader_by_id = {l['id']: {**l, 'children': []} for l in leaders}

        # 親を優先順に紐付け（sub_manager → team → manager → department）
        for l in leaders:
            parent = None
            if l['sub_manager_id'] and l['sub_manager_id'] in sub_mgr_by_id:
                parent = sub_mgr_by_id[l['sub_manager_id']]
            elif l['team_id'] and l['team_id'] in team_by_id:
                parent = team_by_id[l['team_id']]
            elif l['manager_id'] and l['manager_id'] in mgr_by_id:
                parent = mgr_by_id[l['manager_id']]
            else:
                parent = dept_by_id[l['department_id']]
            parent['children'].append(leader_by_id[l['id']])

        # ============================
        # 6. メンバー取得
        # ============================
        member_rows = await connection.fetch(
            "SELECT id, name, title, leader_id, sub_manager_id, team_id, manager_id, department_id FROM sales_member;"
        )
        members = [dict(r) for r in member_rows]

        for m in members:
            node = {
                'id': m['id'],
                'name': m['name'],
                'title': m['title'],
                'children': []
            }
            # 親を優先順に紐付け（leader → sub_manager → team → manager → department）
            parent = None
            if m['leader_id'] and m['leader_id'] in leader_by_id:
                parent = leader_by_id[m['leader_id']]
            elif m['sub_manager_id'] and m['sub_manager_id'] in sub_mgr_by_id:
                parent = sub_mgr_by_id[m['sub_manager_id']]
            elif m['team_id'] and m['team_id'] in team_by_id:
                parent = team_by_id[m['team_id']]
            elif m['manager_id'] and m['manager_id'] in mgr_by_id:
                parent = mgr_by_id[m['manager_id']]
            else:
                parent = dept_by_id[m['department_id']]
            parent['children'].append(node)

        # ============================
        # 7. 最終的に課単位で返す
        # ============================
        return list(dept_by_id.values())

    finally:
        await release_connection(connection)
