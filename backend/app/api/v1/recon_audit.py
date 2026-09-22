from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_permissions
from app.services.recon_audit_service import ReconAuditService
from app.schemas.recon_audit import ReconAuditLogResponse, ReconErrorLogResponse
from app.schemas.response import BaseResponse
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["Audit & Centralized Error Logging"])

@router.get("/logs", response_model=BaseResponse[List[ReconAuditLogResponse]])
def list_audit_logs(
    module_name: Optional[str] = Query("ALL"),
    action_type: Optional[str] = Query("ALL"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["audit.view"]))
):
    service = ReconAuditService(db)
    logs = service.list_audit_logs(module_name=module_name, action_type=action_type, skip=skip, limit=limit)
    return BaseResponse(data=logs, message="Daftar audit log aktivitas berhasil diambil")

@router.get("/errors", response_model=BaseResponse[List[ReconErrorLogResponse]])
def list_error_logs(
    module_name: Optional[str] = Query("ALL"),
    recon_run_id: Optional[UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["audit.view"]))
):
    service = ReconAuditService(db)
    errors = service.list_error_logs(module_name=module_name, recon_run_id=recon_run_id, skip=skip, limit=limit)
    return BaseResponse(data=errors, message="Daftar centralized error log berhasil diambil")
