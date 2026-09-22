from typing import Optional, List
from pydantic import BaseModel

class MenuResponse(BaseModel):
    id: int
    parent_id: Optional[int] = None
    menu_code: str
    menu_name: str
    route: Optional[str] = None
    icon: Optional[str] = None
    display_order: int
    is_visible: bool
    is_active: bool
    children: List["MenuResponse"] = []

    class Config:
        from_attributes = True
