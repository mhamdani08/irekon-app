from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class AuthProvider(Base):
    __tablename__ = "auth_providers"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    provider_name = Column(String(100), nullable=False)
    provider_type = Column(String(20), nullable=False) # LOCAL, LDAP, OAUTH
    host = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    base_dn = Column(Text, nullable=True)
    bind_dn = Column(Text, nullable=True)
    bind_password = Column(Text, nullable=True)
    use_ssl = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(Text, nullable=False, index=True)
    expired_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    ip_address = Column(String(100), nullable=True)
    device_name = Column(String(200), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


class LoginHistory(Base):
    __tablename__ = "login_histories"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    login_at = Column(DateTime, default=datetime.utcnow)
    logout_at = Column(DateTime, nullable=True)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(Text, nullable=True)
    status = Column(String(30), nullable=False) # SUCCESS, FAILED
    failure_reason = Column(Text, nullable=True)

    user = relationship("User", back_populates="login_histories")
