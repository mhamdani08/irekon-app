from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_permissions
from app.services.company_service import CompanyService
from app.schemas.company import CompanyProfileCreate, CompanyProfileUpdate, CompanyProfileResponse
from app.schemas.response import BaseResponse
from app.models.user import User

router = APIRouter(prefix="/company", tags=["Company Management"])


@router.get("", response_model=BaseResponse[CompanyProfileResponse])
def get_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["company.view"]))
):
    service = CompanyService(db)
    company = service.get_company()
    return BaseResponse(data=company, message="Data perusahaan berhasil diambil")


@router.post("", response_model=BaseResponse[CompanyProfileResponse])
def create_company(
    body: CompanyProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["company.create"]))
):
    service = CompanyService(db)
    company = service.create_company(body)
    return BaseResponse(data=company, message="Data perusahaan berhasil dibuat")


@router.put("", response_model=BaseResponse[CompanyProfileResponse])
def update_company(
    body: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["company.update"]))
):
    service = CompanyService(db)
    company = service.update_company(body, user_id=current_user.id)
    return BaseResponse(data=company, message="Data perusahaan berhasil diperbarui")


@router.delete("", response_model=BaseResponse[None])
def delete_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["company.delete"]))
):
    service = CompanyService(db)
    service.delete_company()
    return BaseResponse(data=None, message="Data perusahaan berhasil dihapus")
