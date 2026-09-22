from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, RoleResponse
from app.schemas.permission import PermissionResponse
from app.core.security import get_password_hash
from app.exceptions.base import BusinessException, NotFoundException

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def _to_response(self, user: User) -> UserResponse:
        roles_resp = []
        for ur in user.user_roles:
            role = ur.role
            perms = [PermissionResponse.from_orm(rp.permission) for rp in role.role_permissions]
            roles_resp.append(RoleResponse(
                id=role.id,
                role_code=role.role_code,
                role_name=role.role_name,
                description=role.description,
                is_system=role.is_system,
                created_at=role.created_at,
                permissions=perms
            ))
        return UserResponse(
            id=user.id,
            username=user.username,
            employee_no=user.employee_no,
            full_name=user.full_name,
            email=user.email,
            auth_provider=user.auth_provider,
            is_active=user.is_active,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            roles=roles_resp
        )

    def get_user(self, user_id: int) -> UserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Pengguna tidak ditemukan")
        return self._to_response(user)

    def list_users(self, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        users = self.repo.get_all(skip=skip, limit=limit)
        return [self._to_response(u) for u in users]

    def create_user(self, data: UserCreate, current_user_id: Optional[int] = None) -> UserResponse:
        if self.repo.get_by_username(data.username):
            raise BusinessException(f"Username '{data.username}' sudah digunakan")

        user = User(
            username=data.username,
            employee_no=data.employee_no,
            full_name=data.full_name,
            email=data.email,
            password_hash=get_password_hash(data.password),
            auth_provider="LOCAL",
            is_active=True
        )
        self.repo.create(user)

        if data.role_ids:
            self.repo.assign_roles(user.id, data.role_ids, assigned_by_id=current_user_id)

        self.db.commit()
        self.db.refresh(user)
        return self._to_response(user)

    def update_user(self, user_id: int, data: UserUpdate, current_user_id: Optional[int] = None) -> UserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Pengguna tidak ditemukan")

        if data.full_name is not None:
            user.full_name = data.full_name
        if data.employee_no is not None:
            user.employee_no = data.employee_no
        if data.email is not None:
            user.email = data.email
        if data.password is not None and data.password.strip():
            user.password_hash = get_password_hash(data.password)
        if data.is_active is not None:
            user.is_active = data.is_active

        if data.role_ids is not None:
            self.repo.assign_roles(user.id, data.role_ids, assigned_by_id=current_user_id)

        self.repo.update(user)
        self.db.commit()
        self.db.refresh(user)
        return self._to_response(user)
