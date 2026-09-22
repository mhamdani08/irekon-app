from sqlalchemy import Column, BigInteger, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class PermissionGroup(Base):
    __tablename__ = "permission_groups"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    group_code = Column(String(100), unique=True, nullable=False, index=True)
    group_name = Column(String(200), nullable=False)
    display_order = Column(Integer, default=0)
    description = Column(Text, nullable=True)

    permissions = relationship("Permission", back_populates="group", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    permission_group_id = Column(BigInteger, ForeignKey("permission_groups.id", ondelete="CASCADE"), nullable=False)
    permission_code = Column(String(100), unique=True, nullable=False, index=True)
    permission_name = Column(String(200), nullable=False)
    module = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    group = relationship("PermissionGroup", back_populates="permissions")
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    menu_permissions = relationship("MenuPermission", back_populates="permission", cascade="all, delete-orphan")
