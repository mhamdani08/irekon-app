from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CompanyProfileCreate(BaseModel):
    company_name: str
    legal_name: str
    tax_id: Optional[str] = None
    logo_url: Optional[str] = None

    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    country: str

    phone: str
    email: str
    website: Optional[str] = None

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    legal_name: Optional[str] = None
    tax_id: Optional[str] = None
    logo_url: Optional[str] = None

    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class CompanyProfileResponse(BaseModel):
    id: int
    company_code: str
    company_name: str
    legal_name: str
    tax_id: Optional[str] = None
    logo_url: Optional[str] = None

    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    country: str

    phone: str
    email: str
    website: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True