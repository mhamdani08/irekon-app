from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.company_repository import CompanyRepository
from app.models.company import CompanyProfile
from app.schemas.company import CompanyProfileCreate, CompanyProfileUpdate, CompanyProfileResponse
from app.exceptions.base import BusinessException, NotFoundException


class CompanyService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CompanyRepository(db)

    def _to_response(self, company: CompanyProfile) -> CompanyProfileResponse:
        return CompanyProfileResponse.from_orm(company)

    def get_company(self) -> CompanyProfileResponse:
        company = self.repo.get_company()
        if not company:
            raise NotFoundException("Data perusahaan belum ada, silakan buat terlebih dahulu")
        return self._to_response(company)

    def create_company(self, data: CompanyProfileCreate) -> CompanyProfileResponse:
        if self.repo.count_company() > 0:
            raise BusinessException(
                "Sistem hanya mendukung 1 profil perusahaan. Gunakan fitur Update untuk mengubah data."
            )

        company = CompanyProfile(
            company_code="DEFAULT",
            company_name=data.company_name,
            legal_name=data.legal_name,
            tax_id=data.tax_id,
            address_line1=data.address_line1,
            address_line2=data.address_line2,
            city=data.city,
            province=data.province,
            postal_code=data.postal_code,
            country=data.country,
            phone=data.phone,
            email=data.email,
            website=data.website,
        )
        self.repo.create_company(company)

        self.db.commit()
        self.db.refresh(company)
        return self._to_response(company)

    def update_company(self, data: CompanyProfileUpdate, user_id: int) -> CompanyProfileResponse:
        company = self.repo.get_company()
        if not company:
            raise NotFoundException("Data perusahaan belum ada, silakan buat terlebih dahulu")

        if data.company_name is not None:
            company.company_name = data.company_name
        if data.legal_name is not None:
            company.legal_name = data.legal_name
        if data.tax_id is not None:
            company.tax_id = data.tax_id
        if data.address_line1 is not None:
            company.address_line1 = data.address_line1
        if data.address_line2 is not None:
            company.address_line2 = data.address_line2
        if data.city is not None:
            company.city = data.city
        if data.province is not None:
            company.province = data.province
        if data.postal_code is not None:
            company.postal_code = data.postal_code
        if data.country is not None:
            company.country = data.country
        if data.phone is not None:
            company.phone = data.phone
        if data.email is not None:
            company.email = data.email
        if data.website is not None:
            company.website = data.website

        company.updated_by = user_id

        self.repo.update_company(company)
        self.db.commit()
        self.db.refresh(company)
        return self._to_response(company)

    def delete_company(self) -> None:
        company = self.repo.get_company()
        if not company:
            raise NotFoundException("Data perusahaan belum ada")

        self.repo.delete(company)
        self.db.commit()