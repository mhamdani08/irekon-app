from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User, UserRole

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def update(self, user: User) -> User:
        self.db.flush()
        return user

    def assign_roles(self, user_id: int, role_ids: List[int], assigned_by_id: Optional[int] = None):
        self.db.query(UserRole).filter(UserRole.user_id == user_id).delete()
        for r_id in role_ids:
            ur = UserRole(user_id=user_id, role_id=r_id, assigned_by=assigned_by_id)
            self.db.add(ur)
        self.db.flush()
