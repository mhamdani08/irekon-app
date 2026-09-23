from typing import Generator, List, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.core.security import decode_jwt_token
from app.models.user import User
from app.exceptions.base import AuthenticationException, AuthorizationException

security = HTTPBearer(auto_error=False)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)) -> User:
    if not credentials or not credentials.credentials:
        raise AuthenticationException("Token akses tidak ditemukan atau header Authorization kosong")
    
    token = credentials.credentials
    payload = decode_jwt_token(token)
    if not payload or payload.get("type") != "access":
        raise AuthenticationException("Token akses tidak valid atau telah kadaluarsa")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException("Subject token tidak ditemukan")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise AuthenticationException("Pengguna tidak ditemukan")
    
    if not user.is_active:
        raise AuthenticationException("Akun pengguna dinonaktifkan")
    
    return user

def require_permissions(required_permissions: List[str]) -> Callable:
    def dependency(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        # Superadmin bypass check
        is_superadmin = any(ur.role.role_code == "SUPER_ADMIN" for ur in user.user_roles)
        if is_superadmin:
            return user

        user_permission_codes = set()
        for ur in user.user_roles:
            for rp in ur.role.role_permissions:
                user_permission_codes.add(rp.permission.permission_code)
        
        missing = [p for p in required_permissions if p not in user_permission_codes]
        if missing:
            raise AuthorizationException(f"Anda tidak memiliki izin: {', '.join(missing)}")
        
        return user
    return dependency
