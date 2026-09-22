from typing import List
from sqlalchemy.orm import Session
from app.repositories.role_repository import RoleRepository
from app.repositories.permission_repository import PermissionRepository
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse
from app.schemas.permission import PermissionGroupResponse, PermissionResponse
from app.exceptions.base import BusinessException, NotFoundException

class RoleService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RoleRepository(db)
        self.perm_repo = PermissionRepository(db)

    def _to_response(self, role: Role) -> RoleResponse:
        perms = [PermissionResponse.from_orm(rp.permission) for rp in role.role_permissions]
        return RoleResponse(
            id=role.id,
            role_code=role.role_code,
            role_name=role.role_name,
            description=role.description,
            is_system=role.is_system,
            created_at=role.created_at,
            permissions=perms
        )

    def list_roles(self) -> List[RoleResponse]:
        roles = self.repo.get_all()
        return [self._to_response(r) for r in roles]

    def get_role(self, role_id: int) -> RoleResponse:
        role = self.repo.get_by_id(role_id)
        if not role:
            raise NotFoundException("Role tidak ditemukan")
        return self._to_response(role)

    def create_role(self, data: RoleCreate) -> RoleResponse:
        if self.repo.get_by_code(data.role_code):
            raise BusinessException(f"Kode role '{data.role_code}' sudah digunakan")

        role = Role(
            role_code=data.role_code.upper(),
            role_name=data.role_name,
            description=data.description,
            is_system=False
        )
        self.repo.create(role)

        if data.permission_ids:
            self.repo.assign_permissions(role.id, data.permission_ids)

        self.db.commit()
        self.db.refresh(role)
        return self._to_response(role)

    def update_role(self, role_id: int, data: RoleUpdate) -> RoleResponse:
        role = self.repo.get_by_id(role_id)
        if not role:
            raise NotFoundException("Role tidak ditemukan")

        if role.is_system:
            raise BusinessException("Role sistem bawaan tidak dapat diubah nama/kodenya")

        if data.role_name is not None:
            role.role_name = data.role_name
        if data.description is not None:
            role.description = data.description

        if data.permission_ids is not None:
            self.repo.assign_permissions(role.id, data.permission_ids)

        self.repo.update(role)
        self.db.commit()
        self.db.refresh(role)
        return self._to_response(role)

    def list_permission_groups(self) -> List[PermissionGroupResponse]:
        groups = self.perm_repo.get_all_groups()
        return [PermissionGroupResponse.from_orm(g) for g in groups]
