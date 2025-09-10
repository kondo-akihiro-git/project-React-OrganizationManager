# backend/api/schema/user_schema.py
from pydantic import BaseModel
from typing import Optional, Literal

class CreateSalesUserRequest(BaseModel):
    name: str
    title: Optional[str] = None
    role: Literal["department", "manager", "sub_manager", "leader", "member"]

    department_id: int
    manager_id: Optional[int] = None
    team_id: Optional[int] = None
    sub_manager_id: Optional[int] = None
    leader_id: Optional[int] = None
