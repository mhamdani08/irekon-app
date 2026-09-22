import uuid
from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base

class ReconAuditLog(Base):
    __tablename__ = "recon_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    module_name = Column(String(100), nullable=False, index=True)
    entity_name = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(255), nullable=True, index=True)
    action_type = Column(String(50), nullable=False, index=True) # CREATE, UPDATE, DELETE, EXECUTE, APPROVE, ADJUST
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    action_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_at = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String(100), nullable=True)

    user = relationship("User")


class ReconErrorLog(Base):
    __tablename__ = "recon_error_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_run_id = Column(UUID(as_uuid=True), ForeignKey("recon_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    module_name = Column(String(100), nullable=False, index=True)
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    run = relationship("ReconRun")
