# backend/api/schema/user_shema.py
from pydantic import BaseModel, model_validator
from typing import Optional, Literal

class CreateSalesUserRequest(BaseModel):
    id: Optional[int] = None  # IDを指定可能（例: 20001～）
    name: Optional[str] = None  # nameはsales_member以外でNULL許容
    title: Optional[str] = None
    role: Literal["manager", "sub_manager", "leader", "member"]
    exists: Optional[bool] = True  # existsカラム、デフォルトTRUE
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    team_id: Optional[int] = None
    sub_manager_id: Optional[int] = None
    leader_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_fields(self) -> "CreateSalesUserRequest":
        # roleごとの必須フィールドチェック
        if self.role == "manager":
            if self.name is None and self.exists:
                raise ValueError("name is required for manager when exists is True")
            if not self.department_id:
                raise ValueError("department_id is required for manager")
            if self.team_id or self.sub_manager_id or self.leader_id:
                raise ValueError("team_id, sub_manager_id, leader_id must be null for manager")
        elif self.role == "sub_manager":
            if self.name is None and self.exists:
                raise ValueError("name is required for sub_manager when exists is True")
            if not self.department_id:
                raise ValueError("department_id is required for sub_manager")
            if not (self.team_id or self.manager_id or self.department_id):
                raise ValueError("At least one of team_id, manager_id, or department_id must be provided for sub_manager")
        elif self.role == "leader":
            if self.name is None and self.exists:
                raise ValueError("name is required for leader when exists is True")
            if not self.department_id:
                raise ValueError("department_id is required for leader")
            if not (self.sub_manager_id or self.team_id or self.manager_id or self.department_id):
                raise ValueError("At least one of sub_manager_id, team_id, manager_id, or department_id must be provided for leader")
        elif self.role == "member":
            if not self.name:
                raise ValueError("name is required for member")
            if not self.department_id:
                raise ValueError("department_id is required for member")
            if not (self.leader_id or self.sub_manager_id or self.team_id or self.manager_id or self.department_id):
                raise ValueError("At least one of leader_id, sub_manager_id, team_id, manager_id, or department_id must be provided for member")
        # ID範囲のバリデーション
        if self.id is not None:
            if self.role == "manager" and not (20001 <= self.id < 30000):
                raise ValueError("manager id must be in range 20001-29999")
            elif self.role == "sub_manager" and not (40001 <= self.id < 50000):
                raise ValueError("sub_manager id must be in range 40001-49999")
            elif self.role == "leader" and not (50001 <= self.id < 60000):
                raise ValueError("leader id must be in range 50001-59999")
            elif self.role == "member" and not (60001 <= self.id < 70000):
                raise ValueError("member id must be in range 60001-69999")
        return self