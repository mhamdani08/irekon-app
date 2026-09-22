from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_permissions
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.response import BaseResponse, ListResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=BaseResponse[List[UserResponse]])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user.view"]))
):
    service = UserService(db)
    users = service.list_users(skip=skip, limit=limit)
    return BaseResponse(data=users, message="Daftar user berhasil diambil")

@router.get("/{user_id}", response_model=BaseResponse[UserResponse])
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user.view"]))
):
    service = UserService(db)
    user = service.get_user(user_id)
    return BaseResponse(data=user, message="Detail user berhasil diambil")

@router.post("", response_model=BaseResponse[UserResponse])
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user.create"]))
):
    service = UserService(db)
    user = service.create_user(body, current_user_id=current_user.id)
    return BaseResponse(data=user, message="User berhasil dibuat")

@router.put("/{user_id}", response_model=BaseResponse[UserResponse])
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user.update"]))
):
    service = UserService(db)
    user = service.update_user(user_id, body, current_user_id=current_user.id)
    return BaseResponse(data=user, message="User berhasil diperbarui")
