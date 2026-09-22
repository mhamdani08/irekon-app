from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey
from app.database.session import Base

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(BigInteger, primary_key=True, index=True)
    company_code = Column(String(50), unique=True, nullable=False)

    company_name = Column(String(200), nullable=False)
    legal_name = Column(String(200), nullable=False)
    tax_id = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)

    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)

    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)