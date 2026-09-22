import uuid
from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, String, Text, Boolean, Integer, Numeric, DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base

class ReconRun(Base):
    __tablename__ = "recon_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_profile_id = Column(UUID(as_uuid=True), ForeignKey("recon_profiles.id", ondelete="CASCADE"), nullable=False)
    run_number = Column(String(50), unique=True, nullable=False, index=True)
    run_date = Column(Date, nullable=False, default=datetime.utcnow)
    trigger_type = Column(String(20), default="MANUAL") # MANUAL, SCHEDULER, RERUN
    status = Column(String(30), default="PENDING") # PENDING, RUNNING, SUCCESS, FAILED
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    
    total_records = Column(BigInteger, default=0)
    total_match = Column(BigInteger, default=0)
    total_mismatch = Column(BigInteger, default=0)
    total_missing_core = Column(BigInteger, default=0)
    total_missing_partner = Column(BigInteger, default=0)
    total_duplicate = Column(BigInteger, default=0)
    
    remarks = Column(Text, nullable=True)
    created_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("ReconProfile")
    run_sources = relationship("ReconRunSource", back_populates="run", cascade="all, delete-orphan")
    raw_records = relationship("ReconRawRecord", back_populates="run", cascade="all, delete-orphan")
    normalized_records = relationship("ReconNormalizedRecord", back_populates="run", cascade="all, delete-orphan")
    match_results = relationship("ReconMatchResult", back_populates="run", cascade="all, delete-orphan")


class ReconRunSource(Base):
    __tablename__ = "recon_run_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_run_id = Column(UUID(as_uuid=True), ForeignKey("recon_runs.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("recon_sources.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), default="PENDING") # PENDING, FETCHED, FAILED
    fetched_at = Column(DateTime, default=datetime.utcnow)
    total_records = Column(BigInteger, default=0)
    error_message = Column(Text, nullable=True)

    run = relationship("ReconRun", back_populates="run_sources")
    source = relationship("ReconSource")
    run_files = relationship("ReconRunFile", back_populates="run_source", cascade="all, delete-orphan")


class ReconRunFile(Base):
    __tablename__ = "recon_run_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_run_source_id = Column(UUID(as_uuid=True), ForeignKey("recon_run_sources.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filepath = Column(Text, nullable=True)
    local_filepath = Column(Text, nullable=True)
    archive_filepath = Column(Text, nullable=True)
    file_hash = Column(String(255), nullable=True)
    file_size = Column(BigInteger, default=0)
    total_lines = Column(BigInteger, default=0)
    processed_lines = Column(BigInteger, default=0)
    status = Column(String(30), default="PROCESSED")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    run_source = relationship("ReconRunSource", back_populates="run_files")


class ReconRawRecord(Base):
    __tablename__ = "recon_raw_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_run_id = Column(UUID(as_uuid=True), ForeignKey("recon_runs.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("recon_sources.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("recon_run_files.id", ondelete="SET NULL"), nullable=True)
    line_number = Column(BigInteger, default=1)
    raw_payload = Column(JSON, nullable=False)
    ingestion_status = Column(String(30), default="SUCCESS")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("ReconRun", back_populates="raw_records")
    source = relationship("ReconSource")
    file = relationship("ReconRunFile")


class ReconNormalizedRecord(Base):
    __tablename__ = "recon_normalized_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_run_id = Column(UUID(as_uuid=True), ForeignKey("recon_runs.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("recon_sources.id", ondelete="CASCADE"), nullable=False)
    raw_record_id = Column(UUID(as_uuid=True), ForeignKey("recon_raw_records.id", ondelete="SET NULL"), nullable=True)
    business_key = Column(String(255), nullable=False, index=True)
    trx_date = Column(DateTime, nullable=True)
    amount = Column(Numeric(18, 2), nullable=True)
    normalized_payload = Column(JSON, nullable=False)
    checksum_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("ReconRun", back_populates="normalized_records")
    source = relationship("ReconSource")
    raw_record = relationship("ReconRawRecord")


class ReconMatchResult(Base):
    __tablename__ = "recon_match_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_run_id = Column(UUID(as_uuid=True), ForeignKey("recon_runs.id", ondelete="CASCADE"), nullable=False)
    business_key = Column(String(255), nullable=False, index=True)
    match_status = Column(String(50), nullable=False, index=True) # MATCHED, MISMATCH_AMOUNT, MISMATCH_DATE, MISSING_CORE, MISSING_PARTNER, DUPLICATE
    mismatch_fields = Column(JSON, nullable=True)
    difference_summary = Column(Text, nullable=True)
    core_record_id = Column(UUID(as_uuid=True), ForeignKey("recon_normalized_records.id", ondelete="SET NULL"), nullable=True)
    partner_record_id = Column(UUID(as_uuid=True), ForeignKey("recon_normalized_records.id", ondelete="SET NULL"), nullable=True)
    compared_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("ReconRun", back_populates="match_results")
    core_record = relationship("ReconNormalizedRecord", foreign_keys=[core_record_id])
    partner_record = relationship("ReconNormalizedRecord", foreign_keys=[partner_record_id])
    details = relationship("ReconMatchDetail", back_populates="match_result", cascade="all, delete-orphan")


class ReconMatchDetail(Base):
    __tablename__ = "recon_match_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    match_result_id = Column(UUID(as_uuid=True), ForeignKey("recon_match_results.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    core_value = Column(Text, nullable=True)
    partner_value = Column(Text, nullable=True)
    compare_result = Column(String(30), default="MISMATCH")
    created_at = Column(DateTime, default=datetime.utcnow)

    match_result = relationship("ReconMatchResult", back_populates="details")
