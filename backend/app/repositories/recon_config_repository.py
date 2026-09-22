from typing import Optional, List, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.recon_config import (
    ReconProfile, ReconSchedule, ReconSource, ReconSourceConnection,
    ReconSourceFileConfig, ReconFieldMapping, ReconCompareRule, ReconStatus
)

class ReconConfigRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_profile_by_id(self, profile_id: UUID) -> Optional[ReconProfile]:
        return self.db.query(ReconProfile).filter(ReconProfile.id == profile_id).first()

    def get_profile_by_code(self, recon_code: str) -> Optional[ReconProfile]:
        return self.db.query(ReconProfile).filter(ReconProfile.recon_code == recon_code).first()

    def get_all_profiles(self, skip: int = 0, limit: int = 100) -> List[ReconProfile]:
        return self.db.query(ReconProfile).offset(skip).limit(limit).all()

    def create_profile(self, profile: ReconProfile) -> ReconProfile:
        self.db.add(profile)
        self.db.flush()
        return profile

    def update_profile(self, profile: ReconProfile) -> ReconProfile:
        self.db.flush()
        return profile

    def delete_profile(self, profile: ReconProfile):
        self.db.delete(profile)
        self.db.flush()

    def get_all_statuses(self) -> List[ReconStatus]:
        return self.db.query(ReconStatus).all()

    def add_source(self, source: ReconSource) -> ReconSource:
        self.db.add(source)
        self.db.flush()
        return source

    def get_source_by_id(self, source_id: UUID) -> Optional[ReconSource]:
        return self.db.query(ReconSource).filter(ReconSource.id == source_id).first()

    def delete_source(self, source: ReconSource):
        self.db.delete(source)
        self.db.flush()

    def add_source_connection(self, conn: ReconSourceConnection) -> ReconSourceConnection:
        self.db.add(conn)
        self.db.flush()
        return conn

    def add_source_file_config(self, file_cfg: ReconSourceFileConfig) -> ReconSourceFileConfig:
        self.db.add(file_cfg)
        self.db.flush()
        return file_cfg

    def save_field_mapping(self, mapping: ReconFieldMapping) -> ReconFieldMapping:
        self.db.add(mapping)
        self.db.flush()
        return mapping

    def get_field_mapping_by_id(self, mapping_id: UUID) -> Optional[ReconFieldMapping]:
        return self.db.query(ReconFieldMapping).filter(ReconFieldMapping.id == mapping_id).first()

    def delete_field_mapping(self, mapping: ReconFieldMapping):
        self.db.delete(mapping)
        self.db.flush()

    def save_compare_rule(self, rule: ReconCompareRule) -> ReconCompareRule:
        self.db.add(rule)
        self.db.flush()
        return rule

    def get_compare_rule_by_id(self, rule_id: UUID) -> Optional[ReconCompareRule]:
        return self.db.query(ReconCompareRule).filter(ReconCompareRule.id == rule_id).first()

    def delete_compare_rule(self, rule: ReconCompareRule):
        self.db.delete(rule)
        self.db.flush()

    def save_schedule(self, schedule: ReconSchedule) -> ReconSchedule:
        self.db.add(schedule)
        self.db.flush()
        return schedule
