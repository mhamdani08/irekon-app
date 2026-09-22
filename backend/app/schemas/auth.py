from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
    permissions: List[str]

class RefreshTokenRequest(BaseModel):
    refresh_token: str
