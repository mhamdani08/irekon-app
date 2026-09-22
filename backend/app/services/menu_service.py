from typing import List
from sqlalchemy.orm import Session
from app.repositories.menu_repository import MenuRepository
from app.models.user import User
from app.models.menu import Menu
from app.schemas.menu import MenuResponse

class MenuService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MenuRepository(db)

    def get_user_menu_tree(self, user: User) -> List[MenuResponse]:
        # Collect permissions of current user
        is_superadmin = any(ur.role.role_code == "SUPER_ADMIN" for ur in user.user_roles)
        
        user_permission_codes = set()
        for ur in user.user_roles:
            for rp in ur.role.role_permissions:
                user_permission_codes.add(rp.permission.permission_code)

        all_menus = self.repo.get_all_active_menus()
        
        allowed_menus: List[Menu] = []
        for menu in all_menus:
            if is_superadmin:
                allowed_menus.append(menu)
                continue

            if not menu.menu_permissions:
                allowed_menus.append(menu)
            else:
                has_perm = any(mp.permission.permission_code in user_permission_codes for mp in menu.menu_permissions)
                if has_perm:
                    allowed_menus.append(menu)

        # Build hierarchical tree
        menu_dict = {}
        for m in allowed_menus:
            menu_dict[m.id] = MenuResponse(
                id=m.id,
                parent_id=m.parent_id,
                menu_code=m.menu_code,
                menu_name=m.menu_name,
                route=m.route,
                icon=m.icon,
                display_order=m.display_order,
                is_visible=m.is_visible,
                is_active=m.is_active,
                children=[]
            )

        root_menus: List[MenuResponse] = []
        for m_id, item in menu_dict.items():
            if item.parent_id and item.parent_id in menu_dict:
                menu_dict[item.parent_id].children.append(item)
            else:
                root_menus.append(item)

        return root_menus
