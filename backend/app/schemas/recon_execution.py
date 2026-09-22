from typing import Optional, List, Any, Dict
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel
from app.schemas.recon_config import ReconProfileResponse

# --- Recon Match Detail Schema ---
class ReconMatchDetailResponse(BaseModel):
    id: UUID
    match_result_id: UUID
    field_name: str
    core_value: Optional[str] = None
    partner_value: Optional[str] = None
    compare_result: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Recon Match Result Schema ---
class ReconMatchResultResponse(BaseModel):
    id: UUID
    recon_run_id: UUID
    business_key: str
    match_status: str
    mismatch_fields: Optional[List[str]] = None
    difference_summary: Optional[str] = None
    core_record_id: Optional[UUID] = None
    partner_record_id: Optional[UUID] = None
    core_payload: Optional[Dict[str, Any]] = None
    partner_payload: Optional[Dict[str, Any]] = None
    compared_at: datetime
    details: List[ReconMatchDetailResponse] = []

    class Config:
        from_attributes = True


# --- Recon Run File Schema ---
class ReconRunFileResponse(BaseModel):
    id: UUID
    recon_run_source_id: UUID
    filename: str
    original_filepath: Optional[str] = None
    local_filepath: Optional[str] = None
    archive_filepath: Optional[str] = None
    file_hash: Optional[str] = None
    file_size: int
    total_lines: int
    processed_lines: int
    status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# --- Recon Run Source Schema ---
class ReconRunSourceResponse(BaseModel):
    id: UUID
    recon_run_id: UUID
    source_id: UUID
    status: str
    fetched_at: datetime
    total_records: int
    error_message: Optional[str] = None
    run_files: List[ReconRunFileResponse] = []

    class Config:
        from_attributes = True


# --- Recon Run Schemas ---
class ReconRunTriggerRequest(BaseModel):
    recon_profile_id: UUID
    run_date: Optional[date] = None
    trigger_type: str = "MANUAL" # MANUAL, SCHEDULER, RERUN
    remarks: Optional[str] = None

class ReconRunResponse(BaseModel):
    id: UUID
    recon_profile_id: UUID
    run_number: str
    run_date: date
    trigger_type: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_records: int = 0
    total_match: int = 0
    total_mismatch: int = 0
    total_missing_core: int = 0
    total_missing_partner: int = 0
    total_duplicate: int = 0
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    run_sources: List[ReconRunSourceResponse] = []
    profile: Optional[ReconProfileResponse] = None

    class Config:
        from_attributes = True
