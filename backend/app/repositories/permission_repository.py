from typing import List
from sqlalchemy.orm import Session
from app.models.permission import PermissionGroup, Permission

class PermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_groups(self) -> List[PermissionGroup]:
        return self.db.query(PermissionGroup).order_by(PermissionGroup.display_order.asc()).all()

    def get_all_permissions(self) -> List[Permission]:
        return self.db.query(Permission).all()
