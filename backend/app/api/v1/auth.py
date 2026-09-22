from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest
from app.schemas.response import BaseResponse
from app.schemas.user import UserResponse
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=BaseResponse[TokenResponse])
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    service = AuthService(db)
    result = service.login(
        username=body.username,
        password=body.password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return BaseResponse(data=result, message="Login berhasil")

@router.post("/refresh", response_model=BaseResponse[dict])
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.refresh_access_token(body.refresh_token)
    return BaseResponse(data=result, message="Token berhasil diperbarui")

@router.get("/me", response_model=BaseResponse[dict])
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.user_service import UserService
    service = UserService(db)
    user_data = service.get_user(current_user.id)
    
    user_permissions = set()
    for ur in current_user.user_roles:
        for rp in ur.role.role_permissions:
            user_permissions.add(rp.permission.permission_code)
            
    return BaseResponse(
        data={
            "user": user_data,
            "permissions": list(user_permissions)
        },
        message="Profile berhasil diambil"
    )
