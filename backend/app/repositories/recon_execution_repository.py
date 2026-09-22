from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import desc
from app.models.recon_execution import (
    ReconRun, ReconRunSource, ReconRunFile, ReconRawRecord,
    ReconNormalizedRecord, ReconMatchResult, ReconMatchDetail
)

class ReconExecutionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_run_by_id(self, run_id: UUID) -> Optional[ReconRun]:
        return self.db.query(ReconRun).filter(ReconRun.id == run_id).first()

    def get_run_by_number(self, run_number: str) -> Optional[ReconRun]:
        return self.db.query(ReconRun).filter(ReconRun.run_number == run_number).first()

    def list_runs(
        self, 
        profile_id: Optional[UUID] = None, 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ReconRun]:
        query = self.db.query(ReconRun)
        if profile_id:
            query = query.filter(ReconRun.recon_profile_id == profile_id)
        if status:
            query = query.filter(ReconRun.status == status)
        return query.order_by(desc(ReconRun.created_at)).offset(skip).limit(limit).all()

    def create_run(self, run: ReconRun) -> ReconRun:
        self.db.add(run)
        self.db.flush()
        return run

    def update_run(self, run: ReconRun) -> ReconRun:
        self.db.flush()
        return run

    def save_run_source(self, run_source: ReconRunSource) -> ReconRunSource:
        self.db.add(run_source)
        self.db.flush()
        return run_source

    def save_run_file(self, run_file: ReconRunFile) -> ReconRunFile:
        self.db.add(run_file)
        self.db.flush()
        return run_file

    def save_raw_records_batch(self, records: List[ReconRawRecord]):
        self.db.bulk_save_objects(records)
        self.db.flush()

    def save_normalized_records_batch(self, records: List[ReconNormalizedRecord]):
        self.db.bulk_save_objects(records)
        self.db.flush()

    def save_match_results_batch(self, results: List[ReconMatchResult]):
        self.db.bulk_save_objects(results)
        self.db.flush()

    def get_match_results(
        self, 
        run_id: UUID, 
        status_filter: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ReconMatchResult]:
        query = self.db.query(ReconMatchResult).options(
            joinedload(ReconMatchResult.core_record),
            joinedload(ReconMatchResult.partner_record),
            selectinload(ReconMatchResult.details)
        ).filter(ReconMatchResult.recon_run_id == run_id)
        if status_filter and status_filter != "ALL":
            query = query.filter(ReconMatchResult.match_status == status_filter)
        return query.order_by(ReconMatchResult.compared_at).offset(skip).limit(limit).all()
