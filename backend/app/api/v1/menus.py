from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.services.menu_service import MenuService
from app.schemas.menu import MenuResponse
from app.schemas.response import BaseResponse
from app.models.user import User

router = APIRouter(prefix="/menus", tags=["Menu Management"])

@router.get("/user-menu", response_model=BaseResponse[List[MenuResponse]])
def get_user_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = MenuService(db)
    menus = service.get_user_menu_tree(current_user)
    return BaseResponse(data=menus, message="Menu pengguna berhasil diambil")
