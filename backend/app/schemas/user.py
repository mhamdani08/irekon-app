from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.schemas.role import RoleResponse

class UserCreate(BaseModel):
    username: str
    employee_no: Optional[str] = None
    full_name: str
    email: Optional[EmailStr] = None
    password: str
    role_ids: List[int] = []

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    employee_no: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None

class UserResponse(BaseModel):
    id: int
    username: str
    employee_no: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    auth_provider: str
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    roles: List[RoleResponse] = []

    class Config:
        from_attributes = True
