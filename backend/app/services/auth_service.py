from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.models.auth import RefreshToken, LoginHistory
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_jwt_token
from app.exceptions.base import AuthenticationException, BusinessException
from app.schemas.auth import TokenResponse
from app.schemas.user import UserResponse, RoleResponse
from app.schemas.permission import PermissionResponse

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def login(self, username: str, password: str, ip_address: str = None, user_agent: str = None) -> TokenResponse:
        user = self.user_repo.get_by_username(username)
        
        if not user or not verify_password(password, user.password_hash):
            if user:
                history = LoginHistory(
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    status="FAILED",
                    failure_reason="Invalid Password"
                )
                self.db.add(history)
                self.db.commit()
            raise AuthenticationException("Username atau password salah")

        if not user.is_active:
            raise AuthenticationException("Akun Anda telah dinonaktifkan")

        # Update last login
        user.last_login_at = datetime.utcnow()
        
        # Log successful login
        history = LoginHistory(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            status="SUCCESS"
        )
        self.db.add(history)

        # Collect user permissions
        user_permissions = set()
        for ur in user.user_roles:
            for rp in ur.role.role_permissions:
                user_permissions.add(rp.permission.permission_code)

        # Create JWT Tokens
        token_data = {"sub": str(user.id), "username": user.username}
        access_token = create_access_token(token_data)
        refresh_token_str = create_refresh_token(token_data)

        # Save refresh token
        ref_token_obj = RefreshToken(
            user_id=user.id,
            token_hash=refresh_token_str,
            expired_at=datetime.utcnow() + timedelta(days=7),
            ip_address=ip_address,
            device_name=user_agent
        )
        self.db.add(ref_token_obj)
        self.db.commit()

        # Format user response
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

        user_resp = UserResponse(
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

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            user=user_resp,
            permissions=list(user_permissions)
        )

    def refresh_access_token(self, refresh_token_str: str) -> dict:
        payload = decode_jwt_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise AuthenticationException("Refresh token tidak valid")

        user_id = payload.get("sub")
        token_record = self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == refresh_token_str,
            RefreshToken.user_id == int(user_id),
            RefreshToken.revoked_at.is_(None)
        ).first()

        if not token_record or token_record.expired_at < datetime.utcnow():
            raise AuthenticationException("Refresh token telah kedaluwarsa atau di-revoke")

        user = self.user_repo.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise AuthenticationException("Pengguna tidak aktif")

        new_access_token = create_access_token({"sub": str(user.id), "username": user.username})
        return {"access_token": new_access_token, "token_type": "bearer"}
