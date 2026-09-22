from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class ReconAuditLogResponse(BaseModel):
    id: UUID
    module_name: str
    entity_name: str
    entity_id: Optional[str] = None
    action_type: str
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None
    action_by: Optional[int] = None
    action_at: datetime
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True


class ReconErrorLogResponse(BaseModel):
    id: UUID
    recon_run_id: Optional[UUID] = None
    module_name: str
    error_message: str
    stack_trace: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
