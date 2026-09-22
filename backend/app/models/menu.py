from sqlalchemy import Column, BigInteger, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Menu(Base):
    __tablename__ = "menus"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    parent_id = Column(BigInteger, ForeignKey("menus.id", ondelete="CASCADE"), nullable=True)
    menu_code = Column(String(100), unique=True, nullable=False, index=True)
    menu_name = Column(String(200), nullable=False)
    route = Column(String(255), nullable=True)
    icon = Column(String(100), nullable=True)
    display_order = Column(Integer, default=0)
    is_visible = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    parent = relationship("Menu", remote_side=[id], backref="children")
    menu_permissions = relationship("MenuPermission", back_populates="menu", cascade="all, delete-orphan")


class MenuPermission(Base):
    __tablename__ = "menu_permissions"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    menu_id = Column(BigInteger, ForeignKey("menus.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(BigInteger, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)

    menu = relationship("Menu", back_populates="menu_permissions")
    permission = relationship("Permission", back_populates="menu_permissions")
