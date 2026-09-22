from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_permissions
from app.services.recon_config_service import ReconConfigService
from app.schemas.recon_config import (
    ReconProfileCreate, ReconProfileUpdate, ReconProfileResponse,
    ReconSourceCreate, ReconFieldMappingCreate, ReconCompareRuleCreate,
    ReconStatusResponse, TestConnectionRequest, TestConnectionResponse
)
from app.schemas.response import BaseResponse
from app.models.user import User

router = APIRouter(prefix="/recon-config", tags=["Reconciliation Configuration"])

@router.get("/profiles", response_model=BaseResponse[List[ReconProfileResponse]])
def list_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.view"]))
):
    service = ReconConfigService(db)
    profiles = service.list_profiles(skip=skip, limit=limit)
    return BaseResponse(data=profiles, message="Daftar profil rekonsiliasi berhasil diambil")

@router.get("/profiles/{profile_id}", response_model=BaseResponse[ReconProfileResponse])
def get_profile(
    profile_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.view"]))
):
    service = ReconConfigService(db)
    profile = service.get_profile(profile_id)
    return BaseResponse(data=profile, message="Detail profil rekonsiliasi berhasil diambil")

@router.post("/profiles", response_model=BaseResponse[ReconProfileResponse])
def create_profile(
    body: ReconProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.create"]))
):
    service = ReconConfigService(db)
    profile = service.create_profile(body, user_id=current_user.id)
    return BaseResponse(data=profile, message="Profil rekonsiliasi berhasil dibuat")

@router.put("/profiles/{profile_id}", response_model=BaseResponse[ReconProfileResponse])
def update_profile(
    profile_id: UUID,
    body: ReconProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    profile = service.update_profile(profile_id, body)
    return BaseResponse(data=profile, message="Profil rekonsiliasi berhasil diperbarui")

@router.patch("/profiles/{profile_id}/status", response_model=BaseResponse[ReconProfileResponse])
def toggle_profile_status(
    profile_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    profile = service.toggle_profile_status(profile_id)
    return BaseResponse(data=profile, message="Status keaktifan profil rekonsiliasi berhasil diperbarui")

@router.delete("/profiles/{profile_id}", response_model=BaseResponse[None])
def delete_profile(
    profile_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    service.delete_profile(profile_id)
    return BaseResponse(data=None, message="Profil rekonsiliasi berhasil dihapus")

@router.post("/profiles/{profile_id}/sources", response_model=BaseResponse[ReconProfileResponse])
def add_source(
    profile_id: UUID,
    body: ReconSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    profile = service.add_source(profile_id, body)
    return BaseResponse(data=profile, message="Sumber data berhasil ditambahkan ke profil")

@router.delete("/sources/{source_id}", response_model=BaseResponse[None])
def delete_source(
    source_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    service.delete_source(source_id)
    return BaseResponse(data=None, message="Sumber data berhasil dihapus")

@router.put("/sources/{source_id}", response_model=BaseResponse[ReconProfileResponse])
def update_source(
    source_id: UUID,
    body: ReconSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    profile = service.update_source(source_id, body)
    return BaseResponse(data=profile, message="Sumber data berhasil diperbarui")

@router.post("/sources/test-connection", response_model=BaseResponse[TestConnectionResponse])
def test_source_connection(
    body: TestConnectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.view"]))
):
    service = ReconConfigService(db)
    res = service.test_connection(body)
    return BaseResponse(data=res, message=res.message)

@router.post("/profiles/{profile_id}/field-mappings", response_model=BaseResponse[ReconProfileResponse])
def add_field_mapping(
    profile_id: UUID,
    body: ReconFieldMappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    profile = service.add_field_mapping(profile_id, body)
    return BaseResponse(data=profile, message="Field mapping berhasil disimpan")

@router.put("/field-mappings/{mapping_id}", response_model=BaseResponse[ReconProfileResponse])
def update_field_mapping(
    mapping_id: UUID,
    body: ReconFieldMappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    profile = service.update_field_mapping(mapping_id, body)
    return BaseResponse(data=profile, message="Field mapping berhasil diperbarui")

@router.delete("/field-mappings/{mapping_id}", response_model=BaseResponse[None])
def delete_field_mapping(
    mapping_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    service.delete_field_mapping(mapping_id)
    return BaseResponse(data=None, message="Field mapping berhasil dihapus")

@router.post("/profiles/{profile_id}/compare-rules", response_model=BaseResponse[ReconProfileResponse])
def add_compare_rule(
    profile_id: UUID,
    body: ReconCompareRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    profile = service.add_compare_rule(profile_id, body)
    return BaseResponse(data=profile, message="Compare rule berhasil disimpan")

@router.delete("/compare-rules/{rule_id}", response_model=BaseResponse[None])
def delete_compare_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.profile.update"]))
):
    service = ReconConfigService(db)
    service.delete_compare_rule(rule_id)
    return BaseResponse(data=None, message="Compare rule berhasil dihapus")

@router.get("/statuses", response_model=BaseResponse[List[ReconStatusResponse]])
def list_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReconConfigService(db)
    statuses = service.list_statuses()
    return BaseResponse(data=statuses, message="Daftar status master berhasil diambil")
