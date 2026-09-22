from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.company_repository import CompanyRepository
from app.models.company import CompanyProfile
from app.schemas.company import CompanyProfileCreate, CompanyProfileUpdate, CompanyProfileResponse
from app.exceptions.base import BusinessException, NotFoundException

