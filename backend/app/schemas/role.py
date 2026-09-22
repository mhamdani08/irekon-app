from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.permission import PermissionResponse

class RoleCreate(BaseModel):
    role_code: str
    role_name: str
    description: Optional[str] = None
    permission_ids: List[int] = []

class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None

class RoleResponse(BaseModel):
    id: int
    role_code: str
    role_name: str
    description: Optional[str] = None
    is_system: bool
    created_at: datetime
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True
