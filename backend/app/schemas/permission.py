from typing import Optional, List
from pydantic import BaseModel

class PermissionResponse(BaseModel):
    id: int
    permission_group_id: int
    permission_code: str
    permission_name: str
    module: str
    action: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class PermissionGroupResponse(BaseModel):
    id: int
    group_code: str
    group_name: str
    display_order: int
    description: Optional[str] = None
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True
