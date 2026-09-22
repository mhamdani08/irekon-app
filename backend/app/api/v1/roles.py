from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_permissions
from app.services.role_service import RoleService
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse
from app.schemas.permission import PermissionGroupResponse
from app.schemas.response import BaseResponse
from app.models.user import User

router = APIRouter(prefix="/roles", tags=["Role Management"])

@router.get("", response_model=BaseResponse[List[RoleResponse]])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["role.view"]))
):
    service = RoleService(db)
    roles = service.list_roles()
    return BaseResponse(data=roles, message="Daftar role berhasil diambil")

@router.get("/permissions/groups", response_model=BaseResponse[List[PermissionGroupResponse]])
def list_permission_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["role.view"]))
):
    service = RoleService(db)
    groups = service.list_permission_groups()
    return BaseResponse(data=groups, message="Daftar permission group berhasil diambil")

@router.get("/{role_id}", response_model=BaseResponse[RoleResponse])
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["role.view"]))
):
    service = RoleService(db)
    role = service.get_role(role_id)
    return BaseResponse(data=role, message="Detail role berhasil diambil")

@router.post("", response_model=BaseResponse[RoleResponse])
def create_role(
    body: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["role.create"]))
):
    service = RoleService(db)
    role = service.create_role(body)
    return BaseResponse(data=role, message="Role berhasil dibuat")

@router.put("/{role_id}", response_model=BaseResponse[RoleResponse])
def update_role(
    role_id: int,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["role.update"]))
):
    service = RoleService(db)
    role = service.update_role(role_id, body)
    return BaseResponse(data=role, message="Role berhasil diperbarui")
