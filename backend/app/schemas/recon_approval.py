from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

# --- Approval Schemas ---
class ReconApprovalCreate(BaseModel):
    match_result_id: UUID
    approval_status: str # APPROVED, REJECTED
    notes: Optional[str] = None

class ReconApprovalResponse(BaseModel):
    id: UUID
    match_result_id: UUID
    approval_status: str
    approved_by: Optional[int] = None
    approved_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# --- Manual Adjustment Schemas ---
class ReconAdjustmentCreate(BaseModel):
    match_result_id: UUID
    adjustment_type: str = "FORCE_MATCH" # FORCE_MATCH, FORCE_SETTLE, OVERRIDE_AMOUNT
    new_value: Optional[Dict[str, Any]] = None
    reason: str

class ReconAdjustmentResponse(BaseModel):
    id: UUID
    match_result_id: UUID
    adjustment_type: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    reason: str
    adjusted_by: Optional[int] = None
    adjusted_at: datetime

    class Config:
        from_attributes = True
