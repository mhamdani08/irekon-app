import traceback
from datetime import datetime
from typing import List, Optional, Any, Dict
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.recon_audit import ReconAuditLog, ReconErrorLog
from app.schemas.recon_audit import ReconAuditLogResponse, ReconErrorLogResponse

class ReconAuditService:
    def __init__(self, db: Session):
        self.db = db

    def log_action(
        self,
        module_name: str,
        entity_name: str,
        entity_id: Optional[str],
        action_type: str,
        user_id: Optional[int] = None,
        old_data: Optional[Dict[str, Any]] = None,
        new_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> ReconAuditLog:
        audit = ReconAuditLog(
            module_name=module_name,
            entity_name=entity_name,
            entity_id=str(entity_id) if entity_id else None,
            action_type=action_type,
            old_data=old_data,
            new_data=new_data,
            action_by=user_id,
            action_at=datetime.utcnow(),
            ip_address=ip_address
        )
        self.db.add(audit)
        self.db.commit()
        return audit

    def log_error(
        self,
        module_name: str,
        error_message: str,
        stack_trace: Optional[str] = None,
        recon_run_id: Optional[UUID] = None,
        payload: Optional[Dict[str, Any]] = None
    ) -> ReconErrorLog:
        err = ReconErrorLog(
            module_name=module_name,
            error_message=error_message,
            stack_trace=stack_trace,
            recon_run_id=recon_run_id,
            payload=payload,
            created_at=datetime.utcnow()
        )
        self.db.add(err)
        self.db.commit()
        return err

    def list_audit_logs(
        self,
        module_name: Optional[str] = None,
        action_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ReconAuditLogResponse]:
        query = self.db.query(ReconAuditLog)
        if module_name and module_name != "ALL":
            query = query.filter(ReconAuditLog.module_name == module_name)
        if action_type and action_type != "ALL":
            query = query.filter(ReconAuditLog.action_type == action_type)
        logs = query.order_by(desc(ReconAuditLog.action_at)).offset(skip).limit(limit).all()
        return [ReconAuditLogResponse.from_orm(l) for l in logs]

    def list_error_logs(
        self,
        module_name: Optional[str] = None,
        recon_run_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ReconErrorLogResponse]:
        query = self.db.query(ReconErrorLog)
        if module_name and module_name != "ALL":
            query = query.filter(ReconErrorLog.module_name == module_name)
        if recon_run_id:
            query = query.filter(ReconErrorLog.recon_run_id == recon_run_id)
        errors = query.order_by(desc(ReconErrorLog.created_at)).offset(skip).limit(limit).all()
        return [ReconErrorLogResponse.from_orm(e) for e in errors]
