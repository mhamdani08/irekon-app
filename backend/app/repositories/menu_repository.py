from typing import List
from sqlalchemy.orm import Session
from app.models.menu import Menu

class MenuRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_active_menus(self) -> List[Menu]:
        return self.db.query(Menu).filter(Menu.is_active == True).order_by(Menu.display_order.asc()).all()
