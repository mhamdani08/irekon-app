from typing import Optional
from sqlalchemy.orm import Session
from app.models.company import CompanyProfile


class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_company(self) -> Optional[CompanyProfile]:
        return self.db.query(CompanyProfile).first()

    def count_company(self) -> int:
        return self.db.query(CompanyProfile).count()

    def create_company(self, company: CompanyProfile) -> CompanyProfile:
        self.db.add(company)
        self.db.flush()
        return company
    
    def update_company(self, company: CompanyProfile) -> CompanyProfile:
        self.db.flush()
        return company

    def delete_company(self, company: CompanyProfile) -> None:
        self.db.delete(company)
        self.db.flush()
