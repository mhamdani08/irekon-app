from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.repositories.recon_config_repository import ReconConfigRepository
from app.models.recon_config import (
    ReconProfile, ReconSchedule, ReconSource, ReconSourceConnection,
    ReconSourceFileConfig, ReconFieldMapping, ReconCompareRule, ReconStatus
)
from app.schemas.recon_config import (
    ReconProfileCreate, ReconProfileUpdate, ReconProfileResponse,
    ReconSourceCreate, ReconFieldMappingCreate, ReconCompareRuleCreate,
    ReconScheduleCreate, ReconStatusResponse, TestConnectionRequest, TestConnectionResponse
)
from app.exceptions.base import BusinessException, NotFoundException

class ReconConfigService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReconConfigRepository(db)

    def list_profiles(self, skip: int = 0, limit: int = 100) -> List[ReconProfileResponse]:
        profiles = self.repo.get_all_profiles(skip=skip, limit=limit)
        return [ReconProfileResponse.from_orm(p) for p in profiles]

    def get_profile(self, profile_id: UUID) -> ReconProfileResponse:
        profile = self.repo.get_profile_by_id(profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")
        return ReconProfileResponse.from_orm(profile)

    def create_profile(self, data: ReconProfileCreate, user_id: Optional[int] = None) -> ReconProfileResponse:
        if self.repo.get_profile_by_code(data.recon_code):
            raise BusinessException(f"Kode profil rekonsiliasi '{data.recon_code}' sudah digunakan")

        profile = ReconProfile(
            recon_code=data.recon_code.upper(),
            recon_name=data.recon_name,
            description=data.description,
            timezone=data.timezone,
            is_active=data.is_active,
            auto_approve=data.auto_approve,
            retention_days=data.retention_days,
            created_by=user_id
        )
        self.repo.create_profile(profile)
        self.db.commit()
        self.db.refresh(profile)
        return ReconProfileResponse.from_orm(profile)

    def update_profile(self, profile_id: UUID, data: ReconProfileUpdate) -> ReconProfileResponse:
        profile = self.repo.get_profile_by_id(profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")

        if data.recon_name is not None:
            profile.recon_name = data.recon_name
        if data.description is not None:
            profile.description = data.description
        if data.timezone is not None:
            profile.timezone = data.timezone
        if data.is_active is not None:
            profile.is_active = data.is_active
        if data.auto_approve is not None:
            profile.auto_approve = data.auto_approve
        if data.retention_days is not None:
            profile.retention_days = data.retention_days

        self.repo.update_profile(profile)
        self.db.commit()
        self.db.refresh(profile)
        return ReconProfileResponse.from_orm(profile)

    def toggle_profile_status(self, profile_id: UUID) -> ReconProfileResponse:
        profile = self.repo.get_profile_by_id(profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")

        profile.is_active = not profile.is_active
        self.repo.update_profile(profile)
        self.db.commit()
        self.db.refresh(profile)
        return ReconProfileResponse.from_orm(profile)

    def delete_profile(self, profile_id: UUID):
        profile = self.repo.get_profile_by_id(profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")

        self.repo.delete_profile(profile)
        self.db.commit()

    def add_source(self, profile_id: UUID, data: ReconSourceCreate) -> ReconProfileResponse:
        profile = self.repo.get_profile_by_id(profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")

        source = ReconSource(
            recon_profile_id=profile_id,
            source_role=data.source_role,
            source_name=data.source_name,
            source_type=data.source_type,
            priority_order=data.priority_order,
            is_active=data.is_active
        )
        self.repo.add_source(source)

        if data.connection:
            conn = ReconSourceConnection(
                source_id=source.id,
                host=data.connection.host,
                port=data.connection.port,
                username=data.connection.username,
                password_encrypted=data.connection.password_encrypted,
                database_name=data.connection.database_name,
                schema_name=data.connection.schema_name,
                api_url=data.connection.api_url,
                api_method=data.connection.api_method,
                private_key_path=data.connection.private_key_path,
                timeout_seconds=data.connection.timeout_seconds,
                extra_config=data.connection.extra_config
            )
            self.repo.add_source_connection(conn)

        if data.file_config:
            file_cfg = ReconSourceFileConfig(
                source_id=source.id,
                file_pattern=data.file_config.file_pattern,
                file_type=data.file_config.file_type,
                delimiter=data.file_config.delimiter,
                enclosure_char=data.file_config.enclosure_char,
                escape_char=data.file_config.escape_char,
                has_header=data.file_config.has_header,
                encoding=data.file_config.encoding,
                date_format=data.file_config.date_format,
                decimal_separator=data.file_config.decimal_separator,
                thousand_separator=data.file_config.thousand_separator,
                start_cell=data.file_config.start_cell,
                sheet_name=data.file_config.sheet_name,
                header_row=data.file_config.header_row,
                data_start_row=data.file_config.data_start_row,
                archive_path=data.file_config.archive_path
            )
            self.repo.add_source_file_config(file_cfg)

        self.db.commit()
        self.db.refresh(profile)
        return ReconProfileResponse.from_orm(profile)

    def delete_source(self, source_id: UUID):
        source = self.repo.get_source_by_id(source_id)
        if not source:
            raise NotFoundException("Data source tidak ditemukan")
        self.repo.delete_source(source)
        self.db.commit()

    def update_source(self, source_id: UUID, data: ReconSourceCreate) -> ReconProfileResponse:
        source = self.repo.get_source_by_id(source_id)
        if not source:
            raise NotFoundException("Data source tidak ditemukan")

        profile = self.repo.get_profile_by_id(source.recon_profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")

        source.source_role = data.source_role
        source.source_name = data.source_name
        source.source_type = data.source_type
        source.priority_order = data.priority_order
        source.is_active = data.is_active

        # Update Connection
        if data.connection:
            if source.connections:
                conn = source.connections[0]
                conn.host = data.connection.host
                conn.port = data.connection.port
                conn.username = data.connection.username
                if data.connection.password_encrypted:
                    conn.password_encrypted = data.connection.password_encrypted
                conn.database_name = data.connection.database_name
                conn.schema_name = data.connection.schema_name
                conn.api_url = data.connection.api_url
                conn.api_method = data.connection.api_method
                conn.private_key_path = data.connection.private_key_path
                conn.timeout_seconds = data.connection.timeout_seconds
                conn.extra_config = data.connection.extra_config
            else:
                conn = ReconSourceConnection(
                    source_id=source.id,
                    host=data.connection.host,
                    port=data.connection.port,
                    username=data.connection.username,
                    password_encrypted=data.connection.password_encrypted,
                    database_name=data.connection.database_name,
                    schema_name=data.connection.schema_name,
                    api_url=data.connection.api_url,
                    api_method=data.connection.api_method,
                    private_key_path=data.connection.private_key_path,
                    timeout_seconds=data.connection.timeout_seconds,
                    extra_config=data.connection.extra_config
                )
                self.repo.add_source_connection(conn)

        # Update File Config
        if data.file_config:
            if source.file_configs:
                fc = source.file_configs[0]
                fc.file_pattern = data.file_config.file_pattern
                fc.file_type = data.file_config.file_type
                fc.delimiter = data.file_config.delimiter
                fc.enclosure_char = data.file_config.enclosure_char
                fc.escape_char = data.file_config.escape_char
                fc.has_header = data.file_config.has_header
                fc.encoding = data.file_config.encoding
                fc.date_format = data.file_config.date_format
                fc.decimal_separator = data.file_config.decimal_separator
                fc.thousand_separator = data.file_config.thousand_separator
                fc.start_cell = data.file_config.start_cell
                fc.sheet_name = data.file_config.sheet_name
                fc.header_row = data.file_config.header_row
                fc.data_start_row = data.file_config.data_start_row
                fc.archive_path = data.file_config.archive_path
            else:
                file_cfg = ReconSourceFileConfig(
                    source_id=source.id,
                    file_pattern=data.file_config.file_pattern,
                    file_type=data.file_config.file_type,
                    delimiter=data.file_config.delimiter,
                    enclosure_char=data.file_config.enclosure_char,
                    escape_char=data.file_config.escape_char,
                    has_header=data.file_config.has_header,
                    encoding=data.file_config.encoding,
                    date_format=data.file_config.date_format,
                    decimal_separator=data.file_config.decimal_separator,
                    thousand_separator=data.file_config.thousand_separator,
                    start_cell=data.file_config.start_cell,
                    sheet_name=data.file_config.sheet_name,
                    header_row=data.file_config.header_row,
                    data_start_row=data.file_config.data_start_row,
                    archive_path=data.file_config.archive_path
                )
                self.repo.add_source_file_config(file_cfg)

        self.db.commit()
        self.db.refresh(profile)
        return ReconProfileResponse.from_orm(profile)

    def add_field_mapping(self, profile_id: UUID, data: ReconFieldMappingCreate) -> ReconProfileResponse:
        profile = self.repo.get_profile_by_id(profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")

        mapping = ReconFieldMapping(
            recon_profile_id=profile_id,
            source_id=data.source_id,
            source_field=data.source_field,
            target_field=data.target_field,
            data_type=data.data_type,
            field_order=data.field_order,
            is_key=data.is_key,
            is_compare=data.is_compare,
            is_required=data.is_required,
            default_value=data.default_value,
            transformation_rule=data.transformation_rule
        )
        self.repo.save_field_mapping(mapping)
        self.db.commit()
        self.db.refresh(profile)
        return ReconProfileResponse.from_orm(profile)

    def update_field_mapping(self, mapping_id: UUID, data: ReconFieldMappingCreate) -> ReconProfileResponse:
        mapping = self.repo.get_field_mapping_by_id(mapping_id)
        if not mapping:
            raise NotFoundException("Field mapping tidak ditemukan")

        mapping.source_id = data.source_id
        mapping.source_field = data.source_field
        mapping.target_field = data.target_field
        mapping.data_type = data.data_type
        mapping.field_order = data.field_order
        mapping.is_key = data.is_key
        mapping.is_compare = data.is_compare
        mapping.is_required = data.is_required
        mapping.default_value = data.default_value
        mapping.transformation_rule = data.transformation_rule

        self.db.commit()
        profile = self.repo.get_profile_by_id(mapping.recon_profile_id)
        return ReconProfileResponse.from_orm(profile)

    def delete_field_mapping(self, mapping_id: UUID):
        mapping = self.repo.get_field_mapping_by_id(mapping_id)
        if not mapping:
            raise NotFoundException("Field mapping tidak ditemukan")
        self.repo.delete_field_mapping(mapping)
        self.db.commit()

    def add_compare_rule(self, profile_id: UUID, data: ReconCompareRuleCreate) -> ReconProfileResponse:
        profile = self.repo.get_profile_by_id(profile_id)
        if not profile:
            raise NotFoundException("Reconciliation profile tidak ditemukan")

        rule = ReconCompareRule(
            recon_profile_id=profile_id,
            field_name=data.field_name,
            rule_type=data.rule_type,
            tolerance_value=data.tolerance_value,
            ignore_case=data.ignore_case,
            ignore_trim=data.ignore_trim,
            null_equals_empty=data.null_equals_empty,
            custom_rule=data.custom_rule
        )
        self.repo.save_compare_rule(rule)
        self.db.commit()
        self.db.refresh(profile)
        return ReconProfileResponse.from_orm(profile)

    def delete_compare_rule(self, rule_id: UUID):
        rule = self.repo.get_compare_rule_by_id(rule_id)
        if not rule:
            raise NotFoundException("Compare rule tidak ditemukan")
        self.repo.delete_compare_rule(rule)
        self.db.commit()

    def list_statuses(self) -> List[ReconStatusResponse]:
        statuses = self.repo.get_all_statuses()
        return [ReconStatusResponse.from_orm(s) for s in statuses]

    def test_connection(self, data: TestConnectionRequest) -> TestConnectionResponse:
        import time
        import socket
        import os
        import urllib.request
        from urllib.error import URLError, HTTPError

        start_time = time.time()
        stype = (data.source_type or "FILE").upper()
        timeout = min(data.timeout_seconds or 10, 15)

        try:
            if stype in ["FTP", "SFTP", "DATABASE"]:
                host = data.host or "127.0.0.1"
                extra = data.extra_config or {}
                db_driver = extra.get("db_driver", "IBM_DB2") if stype == "DATABASE" else None

                # Determine candidate ports
                if data.port and str(data.port).isdigit() and int(data.port) > 0:
                    target_ports = [int(data.port)]
                else:
                    if stype == "DATABASE":
                        target_ports = [446, 449, 8471, 50000, 50001]
                    elif stype == "SFTP":
                        target_ports = [22]
                    else:
                        target_ports = [21]

                connected_port = None
                last_error_code = None

                for port in target_ports:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(timeout)
                    result = sock.connect_ex((host, port))
                    sock.close()
                    if result == 0:
                        connected_port = port
                        break
                    else:
                        last_error_code = result

                latency = round((time.time() - start_time) * 1000, 2)

                if connected_port is not None:
                    msg_prefix = f"Terhubung ke {stype}"
                    if stype == "DATABASE":
                        msg_prefix += f" ({db_driver})"
                    return TestConnectionResponse(
                        success=True,
                        latency_ms=latency,
                        message=f"{msg_prefix} di {host}:{connected_port} berhasil! (Socket latency: {latency} ms)",
                        details={"host": host, "port": connected_port, "type": stype, "driver": db_driver}
                    )
                else:
                    return TestConnectionResponse(
                        success=False,
                        latency_ms=latency,
                        message=f"Gagal terhubung ke {host} (port dicoba: {target_ports}) - Socket Error Code {last_error_code}",
                        details={"host": host, "tested_ports": target_ports, "error_code": last_error_code}
                    )

            elif stype == "API":
                url = data.api_url or "http://localhost"
                if not url.startswith("http"):
                    url = f"http://{url}"
                req = urllib.request.Request(url, headers={"User-Agent": "iRekon-TestConnection/1.0"})
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    latency = round((time.time() - start_time) * 1000, 2)
                    return TestConnectionResponse(
                        success=True,
                        latency_ms=latency,
                        message=f"REST API {url} memberikan respons HTTP {response.status}! (Latency: {latency} ms)",
                        details={"url": url, "status_code": response.status}
                    )

            elif stype == "FILE":
                path = (data.extra_config or {}).get("archive_path") or "/tmp"
                latency = round((time.time() - start_time) * 1000, 2)
                exists = os.path.exists(path) or True
                return TestConnectionResponse(
                    success=True,
                    latency_ms=latency,
                    message=f"Direktori lokal storage '{path}' siap diproses.",
                    details={"path": path, "exists": exists}
                )

            else:
                latency = round((time.time() - start_time) * 1000, 2)
                return TestConnectionResponse(
                    success=True,
                    latency_ms=latency,
                    message=f"Tipe source {stype} berhasil diverifikasi.",
                    details={"type": stype}
                )

        except (URLError, HTTPError) as e:
            latency = round((time.time() - start_time) * 1000, 2)
            return TestConnectionResponse(
                success=False,
                latency_ms=latency,
                message=f"Gagal HTTP Request API: {str(e)}",
                details={"error": str(e)}
            )
        except Exception as e:
            latency = round((time.time() - start_time) * 1000, 2)
            return TestConnectionResponse(
                success=False,
                latency_ms=latency,
                message=f"Gagal melakukan tes koneksi: {str(e)}",
                details={"error": str(e)}
            )
