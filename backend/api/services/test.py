# backend/api/services/test.py
from db.connection.connection import get_connection, release_connection

async def get_test_data_service():
    """
    test エンドポイントの処理。
    DB から test_table のデータを取得して JSON に変換して返す。
    """
    conn = None
    try:
        # プールからコネクションを取得
        conn = await get_connection()
        rows = await conn.fetch("SELECT * FROM test_table;")
        # dict に変換して返す
        return [dict(row) for row in rows]
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn:
            # コネクションをプールに返却
            await release_connection(conn)
