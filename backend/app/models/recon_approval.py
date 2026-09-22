import uuid
from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base

class ReconApproval(Base):
    __tablename__ = "recon_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    match_result_id = Column(UUID(as_uuid=True), ForeignKey("recon_match_results.id", ondelete="CASCADE"), nullable=False)
    approval_status = Column(String(30), nullable=False) # APPROVED, REJECTED, PENDING
    approved_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    match_result = relationship("ReconMatchResult")
    approver = relationship("User")


class ReconManualAdjustment(Base):
    __tablename__ = "recon_manual_adjustments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    match_result_id = Column(UUID(as_uuid=True), ForeignKey("recon_match_results.id", ondelete="CASCADE"), nullable=False)
    adjustment_type = Column(String(50), nullable=False) # FORCE_MATCH, FORCE_SETTLE, OVERRIDE_AMOUNT
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    reason = Column(Text, nullable=False)
    adjusted_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    adjusted_at = Column(DateTime, default=datetime.utcnow)

    match_result = relationship("ReconMatchResult")
    adjuster = relationship("User")
