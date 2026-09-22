from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

# --- Recon Status Schema ---
class ReconStatusResponse(BaseModel):
    id: UUID
    status_code: str
    status_name: str

    class Config:
        from_attributes = True


# --- Recon Schedule Schema ---
class ReconScheduleCreate(BaseModel):
    schedule_type: str = "CRON" # CRON, INTERVAL
    cron_expression: Optional[str] = None
    interval_minutes: Optional[int] = None
    is_active: bool = True

class ReconScheduleResponse(BaseModel):
    id: UUID
    recon_profile_id: UUID
    schedule_type: str
    cron_expression: Optional[str] = None
    interval_minutes: Optional[int] = None
    is_active: bool
    next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- File Config Schema ---
class ReconSourceFileConfigCreate(BaseModel):
    file_pattern: str
    file_type: str = "CSV"
    delimiter: str = ","
    enclosure_char: str = '"'
    escape_char: str = "\\"
    has_header: bool = True
    encoding: str = "utf-8"
    date_format: str = "YYYY-MM-DD HH:mm:ss"
    decimal_separator: str = "."
    thousand_separator: str = ","
    start_cell: Optional[str] = "A1"
    sheet_name: Optional[str] = "Sheet1"
    header_row: Optional[int] = 1
    data_start_row: Optional[int] = 2
    archive_path: Optional[str] = None

class ReconSourceFileConfigResponse(BaseModel):
    id: UUID
    source_id: UUID
    file_pattern: Optional[str] = None
    file_type: Optional[str] = None
    delimiter: Optional[str] = None
    enclosure_char: Optional[str] = None
    escape_char: Optional[str] = None
    has_header: Optional[bool] = None
    encoding: Optional[str] = None
    date_format: Optional[str] = None
    decimal_separator: Optional[str] = None
    thousand_separator: Optional[str] = None
    start_cell: Optional[str] = None
    sheet_name: Optional[str] = None
    header_row: Optional[int] = None
    data_start_row: Optional[int] = None
    archive_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Source Connection Schema ---
class ReconSourceConnectionCreate(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password_encrypted: Optional[str] = None
    database_name: Optional[str] = None
    schema_name: Optional[str] = None
    api_url: Optional[str] = None
    api_method: Optional[str] = None
    private_key_path: Optional[str] = None
    timeout_seconds: int = 30
    extra_config: Optional[Dict[str, Any]] = None

class ReconSourceConnectionResponse(BaseModel):
    id: UUID
    source_id: UUID
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    database_name: Optional[str] = None
    schema_name: Optional[str] = None
    api_url: Optional[str] = None
    api_method: Optional[str] = None
    timeout_seconds: int
    extra_config: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Recon Source Schema ---
class ReconSourceCreate(BaseModel):
    source_role: str # PRIMARY, SECONDARY, TARGET
    source_name: str
    source_type: str # FTP, SFTP, API, DATABASE, FILE
    priority_order: int = 1
    is_active: bool = True
    connection: Optional[ReconSourceConnectionCreate] = None
    file_config: Optional[ReconSourceFileConfigCreate] = None

class ReconSourceResponse(BaseModel):
    id: UUID
    recon_profile_id: UUID
    source_role: str
    source_name: str
    source_type: str
    priority_order: int
    is_active: bool
    created_at: datetime
    connections: List[ReconSourceConnectionResponse] = []
    file_configs: List[ReconSourceFileConfigResponse] = []

    class Config:
        from_attributes = True


# --- Field Mapping Schema ---
class ReconFieldMappingCreate(BaseModel):
    source_id: UUID
    source_field: str
    target_field: str
    data_type: str = "STRING"
    field_order: int = 1
    is_key: bool = False
    is_compare: bool = True
    is_required: bool = False
    default_value: Optional[str] = None
    transformation_rule: Optional[Dict[str, Any]] = None

class ReconFieldMappingResponse(BaseModel):
    id: UUID
    recon_profile_id: UUID
    source_id: UUID
    source_field: str
    target_field: str
    data_type: str
    field_order: int
    is_key: bool
    is_compare: bool
    is_required: bool
    default_value: Optional[str] = None
    transformation_rule: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Compare Rule Schema ---
class ReconCompareRuleCreate(BaseModel):
    field_name: str
    rule_type: str = "EXACT" # EXACT, TOLERANCE, REGEX
    tolerance_value: Optional[float] = None
    ignore_case: bool = False
    ignore_trim: bool = True
    null_equals_empty: bool = True
    custom_rule: Optional[Dict[str, Any]] = None

class ReconCompareRuleResponse(BaseModel):
    id: UUID
    recon_profile_id: UUID
    field_name: str
    rule_type: str
    tolerance_value: Optional[float] = None
    ignore_case: bool
    ignore_trim: bool
    null_equals_empty: bool
    custom_rule: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Recon Profile Schema ---
class ReconProfileCreate(BaseModel):
    recon_code: str
    recon_name: str
    description: Optional[str] = None
    timezone: str = "Asia/Jakarta"
    is_active: bool = True
    auto_approve: bool = False
    retention_days: int = 30

class ReconProfileUpdate(BaseModel):
    recon_name: Optional[str] = None
    description: Optional[str] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = None
    auto_approve: Optional[bool] = None
    retention_days: Optional[int] = None

class ReconProfileResponse(BaseModel):
    id: UUID
    recon_code: str
    recon_name: str
    description: Optional[str] = None
    timezone: str
    is_active: bool
    auto_approve: bool
    retention_days: int
    created_at: datetime
    updated_at: datetime
    sources: List[ReconSourceResponse] = []
    schedules: List[ReconScheduleResponse] = []
    field_mappings: List[ReconFieldMappingResponse] = []
    compare_rules: List[ReconCompareRuleResponse] = []

    class Config:
        from_attributes = True


# --- Test Connection Schema ---
class TestConnectionRequest(BaseModel):
    source_type: str # FTP, SFTP, API, DATABASE, FILE
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password_encrypted: Optional[str] = None
    database_name: Optional[str] = None
    schema_name: Optional[str] = None
    api_url: Optional[str] = None
    api_method: Optional[str] = "GET"
    private_key_path: Optional[str] = None
    timeout_seconds: int = 10
    extra_config: Optional[Dict[str, Any]] = None

class TestConnectionResponse(BaseModel):
    success: bool
    latency_ms: float
    message: str
    details: Optional[Dict[str, Any]] = None
