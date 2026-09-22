from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_permissions
from app.services.recon_approval_service import ReconApprovalService
from app.schemas.recon_approval import (
    ReconApprovalCreate, ReconApprovalResponse,
    ReconAdjustmentCreate, ReconAdjustmentResponse
)
from app.schemas.response import BaseResponse
from app.models.user import User

router = APIRouter(prefix="/recon-execution/results", tags=["Reconciliation Approval & Adjustments"])

@router.post("/{result_id}/approve", response_model=BaseResponse[ReconApprovalResponse])
def approve_mismatch_result(
    result_id: UUID,
    body: ReconApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.approval.approve"]))
):
    body.match_result_id = result_id
    service = ReconApprovalService(db)
    result = service.approve_match_result(body, user_id=current_user.id)
    return BaseResponse(data=result, message=f"Persetujuan mismatch berhasil diproses ({body.approval_status})")

@router.post("/{result_id}/adjust", response_model=BaseResponse[ReconAdjustmentResponse])
def create_manual_adjustment(
    result_id: UUID,
    body: ReconAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.adjustment.create"]))
):
    body.match_result_id = result_id
    service = ReconApprovalService(db)
    result = service.create_manual_adjustment(body, user_id=current_user.id)
    return BaseResponse(data=result, message="Manual adjustment / Force Match berhasil dilakukan")

@router.get("/{result_id}/history", response_model=BaseResponse[dict])
def get_approval_history(
    result_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.run.execute"]))
):
    service = ReconApprovalService(db)
    history = service.get_approval_history(result_id)
    return BaseResponse(data=history, message="Histori approval & adjustment berhasil diambil")
