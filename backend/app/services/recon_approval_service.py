from datetime import datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.recon_execution import ReconMatchResult, ReconRun
from app.models.recon_approval import ReconApproval, ReconManualAdjustment
from app.schemas.recon_approval import (
    ReconApprovalCreate, ReconApprovalResponse,
    ReconAdjustmentCreate, ReconAdjustmentResponse
)
from app.services.recon_audit_service import ReconAuditService
from app.exceptions.base import BusinessException, NotFoundException

class ReconApprovalService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_service = ReconAuditService(db)

    def approve_match_result(self, data: ReconApprovalCreate, user_id: Optional[int]) -> ReconApprovalResponse:
        match_res = self.db.query(ReconMatchResult).filter(ReconMatchResult.id == data.match_result_id).first()
        if not match_res:
            raise NotFoundException("Record hasil rekonsiliasi tidak ditemukan")

        status = data.approval_status.upper()
        if status not in ["APPROVED", "REJECTED"]:
            raise BusinessException("Status approval harus APPROVED atau REJECTED")

        old_status = match_res.match_status

        # Create approval record
        approval = ReconApproval(
            match_result_id=match_res.id,
            approval_status=status,
            approved_by=user_id,
            approved_at=datetime.utcnow(),
            notes=data.notes
        )
        self.db.add(approval)

        # Update match_result status
        if status == "APPROVED":
            match_res.match_status = "MANUAL_APPROVED"
        else:
            match_res.match_status = "MANUAL_REJECTED"

        self.db.commit()
        self.db.refresh(approval)

        # Log audit action
        self.audit_service.log_action(
            module_name="RECON_APPROVAL",
            entity_name="recon_approvals",
            entity_id=str(approval.id),
            action_type="APPROVE" if status == "APPROVED" else "REJECT",
            user_id=user_id,
            old_data={"match_status": old_status},
            new_data={"match_status": match_res.match_status, "notes": data.notes}
        )

        return ReconApprovalResponse.from_orm(approval)

    def create_manual_adjustment(self, data: ReconAdjustmentCreate, user_id: Optional[int]) -> ReconAdjustmentResponse:
        match_res = self.db.query(ReconMatchResult).filter(ReconMatchResult.id == data.match_result_id).first()
        if not match_res:
            raise NotFoundException("Record hasil rekonsiliasi tidak ditemukan")

        old_val = {
            "business_key": match_res.business_key,
            "match_status": match_res.match_status,
            "difference_summary": match_res.difference_summary,
        }

        # Create adjustment log record
        adjustment = ReconManualAdjustment(
            match_result_id=match_res.id,
            adjustment_type=data.adjustment_type,
            old_value=old_val,
            new_value=data.new_value or {"status": "FORCE_MATCHED"},
            reason=data.reason,
            adjusted_by=user_id,
            adjusted_at=datetime.utcnow()
        )
        self.db.add(adjustment)

        # Force match status update
        match_res.match_status = "FORCE_MATCHED"
        match_res.difference_summary = f"Force matched manually: {data.reason}"

        # Update run stats if applicable
        run = self.db.query(ReconRun).filter(ReconRun.id == match_res.recon_run_id).first()
        if run:
            run.total_match += 1
            if run.total_mismatch > 0:
                run.total_mismatch -= 1

        self.db.commit()
        self.db.refresh(adjustment)

        # Log audit action
        self.audit_service.log_action(
            module_name="RECON_MANUAL_ADJUSTMENT",
            entity_name="recon_manual_adjustments",
            entity_id=str(adjustment.id),
            action_type="ADJUST",
            user_id=user_id,
            old_data=old_val,
            new_data={"match_status": "FORCE_MATCHED", "reason": data.reason}
        )

        return ReconAdjustmentResponse.from_orm(adjustment)

    def get_approval_history(self, match_result_id: UUID) -> dict:
        approvals = self.db.query(ReconApproval).filter(ReconApproval.match_result_id == match_result_id).all()
        adjustments = self.db.query(ReconManualAdjustment).filter(ReconManualAdjustment.match_result_id == match_result_id).all()
        return {
            "approvals": [ReconApprovalResponse.from_orm(a) for a in approvals],
            "adjustments": [ReconAdjustmentResponse.from_orm(a) for a in adjustments]
        }
