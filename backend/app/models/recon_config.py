import uuid
from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, String, Text, Boolean, Integer, Numeric, DateTime, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base

class ReconProfile(Base):
    __tablename__ = "recon_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_code = Column(String(50), unique=True, nullable=False, index=True)
    recon_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    timezone = Column(String(50), default="Asia/Jakarta")
    is_active = Column(Boolean, default=True)
    auto_approve = Column(Boolean, default=False)
    retention_days = Column(Integer, default=30)
    created_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    schedules = relationship("ReconSchedule", back_populates="profile", cascade="all, delete-orphan")
    sources = relationship("ReconSource", back_populates="profile", cascade="all, delete-orphan")
    field_mappings = relationship("ReconFieldMapping", back_populates="profile", cascade="all, delete-orphan")
    compare_rules = relationship("ReconCompareRule", back_populates="profile", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class ReconSchedule(Base):
    __tablename__ = "recon_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_profile_id = Column(UUID(as_uuid=True), ForeignKey("recon_profiles.id", ondelete="CASCADE"), nullable=False)
    schedule_type = Column(String(20), nullable=False, default="CRON") # CRON, INTERVAL
    cron_expression = Column(String(100), nullable=True)
    interval_minutes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    next_run_at = Column(DateTime, nullable=True)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("ReconProfile", back_populates="schedules")


class ReconSource(Base):
    __tablename__ = "recon_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_profile_id = Column(UUID(as_uuid=True), ForeignKey("recon_profiles.id", ondelete="CASCADE"), nullable=False)
    source_role = Column(String(20), nullable=False) # CORE, PARTNER, PRIMARY, SECONDARY, TARGET
    source_name = Column(String(100), nullable=False)
    source_type = Column(String(20), nullable=False) # FTP, SFTP, API, DATABASE, FILE
    priority_order = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("ReconProfile", back_populates="sources")
    connections = relationship("ReconSourceConnection", back_populates="source", cascade="all, delete-orphan")
    file_configs = relationship("ReconSourceFileConfig", back_populates="source", cascade="all, delete-orphan")
    field_mappings = relationship("ReconFieldMapping", back_populates="source", cascade="all, delete-orphan")


class ReconSourceConnection(Base):
    __tablename__ = "recon_source_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("recon_sources.id", ondelete="CASCADE"), nullable=False)
    host = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    username = Column(String(255), nullable=True)
    password_encrypted = Column(Text, nullable=True)
    database_name = Column(String(100), nullable=True)
    schema_name = Column(String(100), nullable=True)
    api_url = Column(Text, nullable=True)
    api_method = Column(String(20), nullable=True)
    private_key_path = Column(Text, nullable=True)
    timeout_seconds = Column(Integer, default=30)
    extra_config = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("ReconSource", back_populates="connections")


class ReconSourceFileConfig(Base):
    __tablename__ = "recon_source_file_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("recon_sources.id", ondelete="CASCADE"), nullable=False)
    file_pattern = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False, default="CSV") # CSV, TXT, EXCEL, JSON
    delimiter = Column(String(10), default=",")
    enclosure_char = Column(String(10), default='"')
    escape_char = Column(String(10), default="\\")
    has_header = Column(Boolean, default=True)
    encoding = Column(String(50), default="utf-8")
    date_format = Column(String(50), default="YYYY-MM-DD HH:mm:ss")
    decimal_separator = Column(String(5), default=".")
    thousand_separator = Column(String(5), default=",")
    start_cell = Column(String(10), default="A1", nullable=True)
    sheet_name = Column(String(100), default="Sheet1", nullable=True)
    header_row = Column(Integer, default=1, nullable=True)
    data_start_row = Column(Integer, default=2, nullable=True)
    archive_path = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("ReconSource", back_populates="file_configs")


class ReconFieldMapping(Base):
    __tablename__ = "recon_field_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_profile_id = Column(UUID(as_uuid=True), ForeignKey("recon_profiles.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("recon_sources.id", ondelete="CASCADE"), nullable=False)
    source_field = Column(String(100), nullable=False)
    target_field = Column(String(100), nullable=False)
    data_type = Column(String(30), default="STRING") # STRING, NUMBER, DATETIME, BOOLEAN
    field_order = Column(Integer, default=1)
    is_key = Column(Boolean, default=False)
    is_compare = Column(Boolean, default=True)
    is_required = Column(Boolean, default=False)
    default_value = Column(String(255), nullable=True)
    transformation_rule = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("ReconProfile", back_populates="field_mappings")
    source = relationship("ReconSource", back_populates="field_mappings")


class ReconCompareRule(Base):
    __tablename__ = "recon_compare_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recon_profile_id = Column(UUID(as_uuid=True), ForeignKey("recon_profiles.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False, default="EXACT") # EXACT, TOLERANCE, REGEX
    tolerance_value = Column(Numeric(18, 2), nullable=True)
    ignore_case = Column(Boolean, default=False)
    ignore_trim = Column(Boolean, default=True)
    null_equals_empty = Column(Boolean, default=True)
    custom_rule = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("ReconProfile", back_populates="compare_rules")


class ReconStatus(Base):
    __tablename__ = "recon_statuses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    status_code = Column(String(50), unique=True, nullable=False, index=True)
    status_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
