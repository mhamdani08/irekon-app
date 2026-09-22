from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.role import Role, RolePermission

class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, role_id: int) -> Optional[Role]:
        return self.db.query(Role).filter(Role.id == role_id).first()

    def get_by_code(self, role_code: str) -> Optional[Role]:
        return self.db.query(Role).filter(Role.role_code == role_code).first()

    def get_all(self) -> List[Role]:
        return self.db.query(Role).all()

    def create(self, role: Role) -> Role:
        self.db.add(role)
        self.db.flush()
        return role

    def update(self, role: Role) -> Role:
        self.db.flush()
        return role

    def assign_permissions(self, role_id: int, permission_ids: List[int]):
        self.db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        for p_id in permission_ids:
            rp = RolePermission(role_id=role_id, permission_id=p_id)
            self.db.add(rp)
        self.db.flush()
