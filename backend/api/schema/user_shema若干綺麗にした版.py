# backend/api/schema/user_shema.py
from pydantic import BaseModel, model_validator
from typing import Optional, Literal

class CreateSalesUserRequest(BaseModel):
    name: Optional[str] = None  # 名前（メンバーは必須、その他はexistsがTrueの場合必須）
    title: Optional[str] = None  # 役職（任意）
    role: Literal["manager", "sub_manager", "leader", "member"]  # 役割
    exists: Optional[bool] = True  # 存在フラグ（デフォルトTrue）
    department_id: Optional[int] = None  # 部署ID
    manager_id: Optional[int] = None  # マネージャーID
    team_id: Optional[int] = None  # チームID
    sub_manager_id: Optional[int] = None  # サブマネージャーID
    leader_id: Optional[int] = None  # リーダーID

    @model_validator(mode="after")
    def validate_fields(self) -> "CreateSalesUserRequest":
        # 役割ごとの必須チェック
        if self.role == "manager":  # 課長
            if self.name is None and self.exists:
                raise ValueError("課長を在籍状態で登録する場合は、名前が必須です。")
            if not self.department_id:
                raise ValueError("課長を登録するには課の指定が必要です。")

        elif self.role == "sub_manager":  # 係長
            if self.name is None and self.exists:
                raise ValueError("係長を在籍状態で登録する場合は、名前が必須です。")
            if not self.department_id:
                raise ValueError("係長を登録するには課の指定が必要です。")
            if not self.manager_id:
                raise ValueError("係長を登録するには課長の指定が必要です。")
            if not self.team_id:
                raise ValueError("係長を登録するには係の指定が必要です。")

        elif self.role == "leader":  # 主任
            if self.name is None and self.exists:
                raise ValueError("主任を在籍状態で登録する場合は、名前が必須です。")
            if not self.department_id:
                raise ValueError("主任を登録するには課の指定が必要です。")
            if not self.manager_id:
                raise ValueError("主任を登録するには課長の指定が必要です。")
            if not self.team_id:
                raise ValueError("主任を登録するには係の指定が必要です。")
            if not self.sub_manager_id:
                raise ValueError("主任を登録するには係長の指定が必要です。")

        elif self.role == "member":  # メンバー
            if not self.name:
                raise ValueError("メンバーを登録するには名前が必須です。")
            if not self.department_id:
                raise ValueError("メンバーを登録するには課の指定が必要です。")
            if not self.manager_id:
                raise ValueError("メンバーを登録するには課長の指定が必要です。")
            if not self.team_id:
                raise ValueError("メンバーを登録するには係の指定が必要です。")
            if not self.sub_manager_id:
                raise ValueError("メンバーを登録するには係長の指定が必要です。")
            if not self.leader_id:
                raise ValueError("メンバーを登録するには主任の指定が必要です。")

        # IDの範囲チェック
        if self.id is not None:
            if self.role == "manager" and not (20001 <= self.id < 30000):
                raise ValueError("内部エラー: 課長のIDが想定範囲外です。")
            elif self.role == "sub_manager" and not (40001 <= self.id < 50000):
                raise ValueError("内部エラー: 係長のIDが想定範囲外です。")
            elif self.role == "leader" and not (50001 <= self.id < 60000):
                raise ValueError("内部エラー: 主任のIDが想定範囲外です。")
            elif self.role == "member" and not (60001 <= self.id < 70000):
                raise ValueError("内部エラー: メンバーのIDが想定範囲外です。")

        return self