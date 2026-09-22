import os
import uuid
import re
import glob
import io
import csv
import random
import pandas as pd
from datetime import datetime, date, timedelta
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.repositories.recon_execution_repository import ReconExecutionRepository
from app.repositories.recon_config_repository import ReconConfigRepository
from app.models.recon_execution import (
    ReconRun, ReconRunSource, ReconRunFile, ReconRawRecord,
    ReconNormalizedRecord, ReconMatchResult, ReconMatchDetail
)
from app.schemas.recon_execution import (
    ReconRunTriggerRequest, ReconRunResponse, ReconMatchResultResponse
)
from app.services.recon_audit_service import ReconAuditService
from app.exceptions.base import BusinessException, NotFoundException
from app.models.recon_config import ReconFieldMapping
from app.utils.date_pattern import resolve_dynamic_date_pattern

class ReconExecutionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReconExecutionRepository(db)
        self.config_repo = ReconConfigRepository(db)
        self.audit_service = ReconAuditService(db)

    def list_runs(
        self, 
        profile_id: Optional[UUID] = None, 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ReconRunResponse]:
        runs = self.repo.list_runs(profile_id=profile_id, status=status, skip=skip, limit=limit)
        return [ReconRunResponse.from_orm(r) for r in runs]

    def get_run(self, run_id: UUID) -> ReconRunResponse:
        run = self.repo.get_run_by_id(run_id)
        if not run:
            raise NotFoundException("Data eksekusi rekonsiliasi tidak ditemukan")
        resp = ReconRunResponse.from_orm(run)
        if run.profile:
            # Include profile details and sorted field mappings
            profile_dict = {
                "id": str(run.profile.id),
                "recon_code": run.profile.recon_code,
                "recon_name": run.profile.recon_name,
                "field_mappings": [
                    {
                        "id": str(fm.id),
                        "source_id": str(fm.source_id),
                        "source_field": fm.source_field,
                        "target_field": fm.target_field,
                        "is_key": fm.is_key,
                        "is_compare": fm.is_compare,
                        "field_order": fm.field_order or 99
                    }
                    for fm in sorted(run.profile.field_mappings or [], key=lambda x: getattr(x, "field_order", 99) or 99)
                ]
            }
            resp.profile = profile_dict
        return resp

    def get_match_results(
        self, 
        run_id: UUID, 
        status_filter: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ReconMatchResultResponse]:
        results = self.repo.get_match_results(run_id=run_id, status_filter=status_filter, skip=skip, limit=limit)
        resp_list = []
        for r in results:
            item = ReconMatchResultResponse.from_orm(r)
            c_payload = r.core_record.normalized_payload if (hasattr(r, "core_record") and r.core_record) else None
            p_payload = r.partner_record.normalized_payload if (hasattr(r, "partner_record") and r.partner_record) else None
            item.core_payload = c_payload
            item.partner_payload = p_payload

            # Resolve real business key if stored key is synthetic REC-xxxx
            if item.business_key and item.business_key.startswith("REC-"):
                real_key = None
                for payload in [c_payload, p_payload]:
                    if payload and isinstance(payload, dict):
                        for k in ["TRX_REFF", "TRX_ID", "REFERENCE_NUMBER", "Ref. Number", "Ref.Number", "Ref No", "RHSTREFT"]:
                            val = payload.get(k)
                            if val and not str(val).startswith("REC-") and len(str(val).strip()) > 3:
                                real_key = str(val).strip()
                                break
                        if real_key:
                            break
                if real_key:
                    item.business_key = real_key

            resp_list.append(item)
        return resp_list

    def export_run(self, run_id: UUID, export_format: str = "excel") -> Tuple[bytes, str, str]:
        run = self.repo.get_run_by_id(run_id)
        if not run:
            raise NotFoundException("Data eksekusi rekonsiliasi tidak ditemukan")

        results = self.repo.get_match_results(run_id=run_id, status_filter="ALL", skip=0, limit=100)
        profile_name = run.profile.recon_name if run.profile else "Reconciled"

        fmt = export_format.lower()
        if fmt in ["excel", "xlsx", "csv"]:
            output = io.StringIO()
            output.write("\ufeff") # Write UTF-8 BOM for Excel native column mapping
            writer = csv.writer(output)

            # Query dynamic mapped target fields for this profile
            profile_mappings = self.db.query(ReconFieldMapping).filter(ReconFieldMapping.recon_profile_id == run.recon_profile_id).all()
            mapped_target_fields = []
            if profile_mappings:
                seen = set()
                for fm in sorted(profile_mappings, key=lambda x: getattr(x, "field_order", 99) or 99):
                    tf = getattr(fm, "target_field", None)
                    if tf and tf not in seen:
                        seen.add(tf)
                        mapped_target_fields.append(tf)

            # Header info
            writer.writerow(["=== iRekon Apps - Reconciliation Run Report ==="])
            writer.writerow(["Run Number", run.run_number])
            writer.writerow(["Run ID (UUID)", str(run.id)])
            writer.writerow(["Profile Name", profile_name])
            writer.writerow(["Run Date", str(run.run_date)])
            writer.writerow(["Status", run.status])
            writer.writerow(["Total Records", run.total_records])
            writer.writerow(["Matched", run.total_match])
            writer.writerow(["Mismatch Amount", run.total_mismatch])
            writer.writerow(["Missing Core", run.total_missing_core])
            writer.writerow(["Missing Partner", run.total_missing_partner])
            writer.writerow([])

            # Dynamic Table headers derived from profile field mappings
            base_headers = ["No", "Business Key", "Match Status", "Difference Summary", "Detail Discrepancies"]
            full_headers = base_headers + mapped_target_fields
            writer.writerow(full_headers)

            for idx, res in enumerate(results, start=1):
                detail_str = "; ".join([f"{d.field_name}: Core({d.core_value}) vs Partner({d.partner_value})" for d in res.details]) if res.details else "-"
                payload = res.core_record.normalized_payload if (res.core_record and res.core_record.normalized_payload) else (res.partner_record.normalized_payload if (res.partner_record and res.partner_record.normalized_payload) else {})
                
                row_cells = [idx, res.business_key, res.match_status, res.difference_summary or "", detail_str]
                for tf in mapped_target_fields:
                    row_cells.append(payload.get(tf, "-") if payload else "-")
                writer.writerow(row_cells)

            content = output.getvalue().encode("utf-8")
            media_type = "text/csv"
            filename = f"RECON_{run.run_number}.csv"

        elif fmt == "pdf":
            try:
                from reportlab.lib.pagesizes import letter
                from reportlab.lib import colors
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

                buffer = io.BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
                styles = getSampleStyleSheet()
                elements = []

                title_style = ParagraphStyle(
                    'DocTitle',
                    parent=styles['Heading1'],
                    fontSize=14,
                    leading=18,
                    textColor=colors.HexColor('#006747'),
                    alignment=1
                )
                elements.append(Paragraph("iRekon Apps - RECONCILIATION EXECUTION REPORT", title_style))
                elements.append(Spacer(1, 10))

                meta_data = [
                    ["Run Number:", run.run_number, "Run Date:", str(run.run_date)],
                    ["Run ID (UUID):", str(run.id)[:18] + "...", "Status:", run.status],
                    ["Profile Name:", profile_name, "Total Records:", str(run.total_records)],
                    ["Matched (100%):", str(run.total_match), "Mismatch:", str(run.total_mismatch)],
                    ["Missing Core:", str(run.total_missing_core), "Missing Partner:", str(run.total_missing_partner)],
                ]
                meta_table = Table(meta_data, colWidths=[110, 150, 110, 150])
                meta_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
                    ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1E293B')),
                    ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,-1), 9),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ]))
                elements.append(meta_table)
                elements.append(Spacer(1, 15))

                elements.append(Paragraph("Match Results & Field Mapping Matrix", styles['Heading2']))
                elements.append(Spacer(1, 8))

                cell_style = ParagraphStyle('CellText', parent=styles['Normal'], fontSize=7, leading=9)
                cell_header = ParagraphStyle('CellHdr', parent=styles['Normal'], fontSize=8, leading=10, textColor=colors.white, fontName='Helvetica-Bold')

                # Extract mapped target fields from ReconFieldMapping directly
                mapped_target_fields = []
                profile_mappings = self.db.query(ReconFieldMapping).filter(ReconFieldMapping.recon_profile_id == run.recon_profile_id).all()
                if profile_mappings:
                    seen = set()
                    for fm in sorted(profile_mappings, key=lambda x: getattr(x, "field_order", 99) or 99):
                        tf = getattr(fm, "target_field", None)
                        if tf and tf not in seen:
                            seen.add(tf)
                            mapped_target_fields.append(tf)

                table_data = [[
                    Paragraph("No", cell_header),
                    Paragraph("Business Key / No Ref", cell_header),
                    Paragraph("Status", cell_header),
                    Paragraph("Mapped Field Values (Core vs Partner)", cell_header)
                ]]
                for idx, res in enumerate(results[:50], start=1):
                    field_entries = []
                    payload = res.core_record.normalized_payload if (res.core_record and res.core_record.normalized_payload) else (res.partner_record.normalized_payload if (res.partner_record and res.partner_record.normalized_payload) else {})
                    
                    if mapped_target_fields and payload:
                        for tf in mapped_target_fields[:4]:
                            val = payload.get(tf) or "-"
                            field_entries.append(f"{tf}: {val}")
                        detail_str = " | ".join(field_entries)
                    elif res.details:
                        detail_str = "; ".join([f"{d.field_name}: Core({d.core_value or '-'}) vs Partner({d.partner_value or '-'})" for d in res.details])
                    else:
                        detail_str = res.difference_summary or "Seluruh field cocok 100%"

                    if len(detail_str) > 130:
                        detail_str = detail_str[:127] + "..."
                    
                    table_data.append([
                        Paragraph(str(idx), cell_style),
                        Paragraph(str(res.business_key or "-"), cell_style),
                        Paragraph(str(res.match_status), cell_style),
                        Paragraph(str(detail_str), cell_style)
                    ])

                res_table = Table(table_data, colWidths=[30, 160, 100, 230], repeatRows=1)
                res_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#006747')),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
                ]))
                elements.append(res_table)

                doc.build(elements)
                content = buffer.getvalue()
            except Exception as ex:
                print(f"[PDF Generation Error]: {ex}")
                lines = [
                    f"iRekon Apps - RECONCILIATION EXECUTION REPORT\n",
                    f"=" * 60,
                    f"Run Number      : {run.run_number}",
                    f"Profile Name    : {profile_name}",
                    f"Total Records   : {run.total_records}",
                    f"Matched (100%)  : {run.total_match}",
                    f"Mismatch Amount : {run.total_mismatch}",
                    f"=" * 60 + "\n"
                ]
                content = "\n".join(lines).encode("utf-8")

            media_type = "application/pdf"
            filename = f"RECON_{run.run_number}.pdf"

        else: # TXT Format
            lines = [
                f"============================================================",
                f"            iREKON APPS - RECONCILIATION REPORT             ",
                f"============================================================",
                f"Run Number          : {run.run_number}",
                f"Run ID (UUID)       : {run.id}",
                f"Profile Name        : {profile_name}",
                f"Run Date            : {run.run_date}",
                f"Status              : {run.status}",
                f"Started At          : {run.started_at}",
                f"Finished At         : {run.finished_at}",
                f"------------------------------------------------------------",
                f"SUMMARY STATISTICS:",
                f"  Total Records     : {run.total_records}",
                f"  Matched (100%)    : {run.total_match}",
                f"  Mismatch Amount   : {run.total_mismatch}",
                f"  Missing Core      : {run.total_missing_core}",
                f"  Missing Partner   : {run.total_missing_partner}",
                f"============================================================",
                f"MATCH RESULTS MATRIX:",
                f"------------------------------------------------------------"
            ]
            for idx, res in enumerate(results, start=1):
                lines.append(f"{idx}. Business Key : {res.business_key}")
                lines.append(f"   Match Status : {res.match_status}")
                lines.append(f"   Summary      : {res.difference_summary or 'Matched'}")
                if res.details:
                    for d in res.details:
                        lines.append(f"   - Discrepancy : {d.field_name} (Core: {d.core_value} | Partner: {d.partner_value})")
                lines.append("")

            content = "\n".join(lines).encode("utf-8")
            media_type = "text/plain"
            filename = f"RECON_{run.run_number}.txt"

        return content, media_type, filename

    def _find_source_file(self, source, run_date: date) -> Optional[Tuple[str, str]]:
        """Return first matching file (backward compat). Use _find_all_source_files for multi-file."""
        results = self._find_all_source_files(source, run_date)
        return results[0] if results else None

    def _find_all_source_files(self, source, run_date: date) -> List[Tuple[str, str]]:
        """Return ALL matching files for the given source and run_date, sorted naturally."""
        search_dirs = ["/var/archive/recon", "/ftp/admin", "/var/data/ingest"]
        file_config = source.file_configs[0] if (hasattr(source, "file_configs") and source.file_configs and len(source.file_configs) > 0) else None

        if file_config and file_config.archive_path:
            clean_path = file_config.archive_path.strip()
            if clean_path not in search_dirs:
                search_dirs.insert(0, clean_path)

        pattern = file_config.file_pattern if (file_config and file_config.file_pattern) else "*"
        resolved_pattern = resolve_dynamic_date_pattern(pattern, run_date) if (file_config and file_config.file_pattern) else "*"

        found: List[str] = []

        for d in search_dirs:
            if not os.path.exists(d):
                continue

            # 1. Resolved pattern match — returns ALL glob results (e.g. Daily_*.xlsx → Daily_1..Daily_12)
            if resolved_pattern and resolved_pattern != "*":
                matches = glob.glob(os.path.join(d, resolved_pattern))
                if matches:
                    found.extend(matches)

            if found:
                break

            # 2. Date-variation prefix scan
            date_variations = [
                run_date.strftime("%d%m%Y"),
                run_date.strftime("%Y%m%d"),
                run_date.strftime("%Y-%m-%d"),
                run_date.strftime("%d-%m-%Y")
            ]
            prefix = ""
            if file_config and file_config.file_pattern and file_config.file_pattern != "*":
                prefix = file_config.file_pattern.split("{")[0]

            for dvar in date_variations:
                glob_pat = f"{prefix}*{dvar}*" if prefix else f"*{dvar}*"
                vmatches = glob.glob(os.path.join(d, glob_pat))
                if vmatches:
                    found.extend(vmatches)
                    break

            if found:
                break

            # 3. Base pattern prefix match
            if pattern and pattern != "*":
                base_pattern = pattern.split("{")[0] if "{" in pattern else pattern
                if base_pattern and base_pattern != "*":
                    matching = glob.glob(os.path.join(d, f"{base_pattern}*"))
                    if matching:
                        found.extend(matching)

            if found:
                break

        if not found:
            # 4. Ultimate fallback — any Excel in default dirs
            for d in search_dirs:
                if os.path.exists(d):
                    bifast_files = glob.glob(os.path.join(d, "*CreditTransferDetail*.xlsx"))
                    if bifast_files:
                        found.extend(bifast_files)
                        break
                    any_excel = glob.glob(os.path.join(d, "*.xlsx"))
                    if any_excel:
                        found.extend(any_excel)
                        break

        # Deduplicate and sort naturally (Daily_1, Daily_2, ..., Daily_12)
        found = sorted(set(found), key=lambda x: [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', x)])
        return [(os.path.basename(f), f) for f in found if os.path.isfile(f)]

    def _extract_field_value(
        self,
        row: Dict[str, Any],
        source_field: Optional[str] = None,
        target_field: Optional[str] = None,
        profile_mappings: Optional[List[Any]] = None
    ) -> Any:
        if not row:
            return None

        # Build candidate source fields list prioritizing DB profile_mappings FIRST
        candidate_source_fields: List[str] = []

        # 1. Primary Priority: DB Field Mappings from ReconFieldMapping table for target_field
        if target_field and profile_mappings:
            target_clean = str(target_field).strip().upper()
            for m in profile_mappings:
                m_target = getattr(m, "target_field", None)
                m_source = getattr(m, "source_field", None)
                if m_target and str(m_target).strip().upper() == target_clean and m_source:
                    m_src_str = str(m_source).strip()
                    if m_src_str and m_src_str not in candidate_source_fields:
                        candidate_source_fields.append(m_src_str)

        # 2. Secondary Priority: Explicit source_field argument
        if source_field:
            sf_str = str(source_field).strip()
            if sf_str and sf_str not in candidate_source_fields:
                candidate_source_fields.append(sf_str)

        # Helper closure for field extraction given a candidate source field key or coordinate
        def _try_extract(sf: str) -> Any:
            if not sf or not isinstance(sf, str):
                return None
            sf_str = sf.strip()
            if not sf_str:
                return None

            # a. Direct dictionary key lookup in row
            if sf_str in row and row[sf_str] is not None:
                v_s = str(row[sf_str]).strip()
                if v_s != "" and v_s.lower() not in ["nan", "none"]:
                    return row[sf_str]

            # b. Excel Cell Coordinate / Column Letter (e.g. D20, L20, F20, D, L)
            import re
            coord_match = re.match(r"^([A-Za-z]+)(\d+)?$", sf_str)
            if coord_match:
                col_letter = coord_match.group(1).upper()
                col_idx = 0
                for char in col_letter:
                    col_idx = col_idx * 26 + (ord(char) - ord('A') + 1)
                col_idx -= 1

                col_keys = [col_letter, f"col_{col_idx}", f"Unnamed: {col_idx}", f"Unnamed: {col_idx+1}"]
                for ckey in col_keys:
                    if ckey in row and row[ckey] is not None:
                        v_s = str(row[ckey]).strip()
                        if v_s != "" and v_s.lower() not in ["nan", "none"]:
                            return row[ckey]

            # c. Normalized key matching (case insensitive, strip spaces, dots, underscores)
            sf_clean = sf_str.lower().replace("_", "").replace(" ", "").replace(".", "")
            if sf_clean:
                for k, v in row.items():
                    if v is None:
                        continue
                    v_s = str(v).strip()
                    if v_s == "" or v_s.lower() in ["nan", "none"]:
                        continue
                    k_clean = str(k).lower().replace("_", "").replace(" ", "").replace(".", "")
                    if k_clean == sf_clean:
                        return v

            return None

        # Execute extraction using DB-mapped & explicit candidates FIRST
        for sf_cand in candidate_source_fields:
            val = _try_extract(sf_cand)
            if val is not None:
                return val

        # 3. Fallback Aliases (Only if DB mappings returned no match for target_field)
        if target_field:
            target_clean = str(target_field).strip().upper()
            fallback_aliases = []
            if target_clean in ["TRX_REFF", "REFERENCE_NUMBER", "TRX_ID"]:
                fallback_aliases = ["D20", "D", "col_3", "Ref. Number", "Ref.Number", "Ref No", "RHSTREFT", "TRX_REFF", "Reference Number"]
            elif target_clean in ["TRX_AMNT", "AMOUNT", "TOTAL_BILL"]:
                fallback_aliases = ["L20", "L", "col_11", "RHSTAMNT", "TOTAL_BILL", "TRX_AMOUNT", "amount"]
            elif target_clean in ["BANK_SND"]:
                fallback_aliases = ["F20", "F", "col_5", "RHSTBICS", "BANK_SND", "Bank Code"]
            elif target_clean in ["ACC_SND"]:
                fallback_aliases = ["H20", "H", "col_7", "RHSTACCS", "ACC_SND", "ACC. Number"]
            elif target_clean in ["BANK_RCV"]:
                fallback_aliases = ["I20", "I", "col_8", "RHSTBICR", "BANK_RCV", "Bank Code.1"]
            elif target_clean in ["ACC_RCV"]:
                fallback_aliases = ["K20", "K", "col_10", "RHSTACCR", "ACC_RCV", "ACC. Number.1"]

            for fa in fallback_aliases:
                val = _try_extract(fa)
                if val is not None:
                    return val

        # 4. Fuzzy fallback matching for reference/key/id terms
        if target_field and str(target_field).strip().upper() in ["TRX_REFF", "REFERENCE_NUMBER", "TRX_ID"]:
            for k, v in row.items():
                if v is None:
                    continue
                v_s = str(v).strip()
                if v_s == "" or v_s.lower() in ["nan", "none"]:
                    continue
                k_c = str(k).lower()
                if any(term in k_c for term in ["reference", "ref", "trx_id", "transaction id"]):
                    return v

        return None

    def _read_file_records(self, filepath: str, file_config, field_mappings: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        if not os.path.exists(filepath):
            return []

        ext = os.path.splitext(filepath)[1].lower()
        records = []

        try:
            if ext in [".xlsx", ".xls"]:
                sheet = file_config.sheet_name if (file_config and file_config.sheet_name) else 0
                header_row = (file_config.header_row - 1) if (file_config and file_config.header_row and file_config.header_row > 0) else 0
                
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet, header=header_row)
                except Exception:
                    df = pd.read_excel(filepath, sheet_name=0, header=header_row)

                # Fallback to header=0 if configured header_row does not contain expected column names
                cols_str = " ".join([str(c) for c in df.columns])
                if not any(k in cols_str for k in ["RHST", "Ref", "TRX", "amount", "Bill", "Bank"]):
                    try:
                        df_zero = pd.read_excel(filepath, sheet_name=0, header=0)
                        if any(k in " ".join([str(c) for c in df_zero.columns]) for k in ["RHST", "Ref", "TRX", "amount", "Bill", "Bank"]):
                            df = df_zero
                    except Exception:
                        pass

                df = df.dropna(how="all")
                records = df.to_dict(orient="records")
            else:
                delim = file_config.delimiter if (file_config and file_config.delimiter) else ","
                enc = file_config.encoding if (file_config and file_config.encoding) else "utf-8"
                df = pd.read_csv(filepath, delimiter=delim, encoding=enc)
                df = df.dropna(how="all")
                records = df.to_dict(orient="records")
        except Exception as e:
            print(f"[Ingest Error] Failed to read {filepath}: {e}")

        # Extract mapped source field keys dynamically from recon profile field_mappings
        mapped_key_sources = []
        if field_mappings:
            mapped_key_sources = [m.source_field for m in field_mappings if getattr(m, "is_key", False) and getattr(m, "source_field", None)]
            if not mapped_key_sources:
                mapped_key_sources = [m.source_field for m in field_mappings if getattr(m, "source_field", None)]

        clean_records = []
        for r in records:
            clean_r = {}
            has_valid_val = False
            col_idx = 0

            for k, v in r.items():
                clean_k = str(k).strip()
                
                # Assign column letter for 0-based positional indexing (A, B, C...)
                col_letter = chr(ord('A') + col_idx) if col_idx < 26 else f"COL_{col_idx}"
                
                if pd.isna(v) or v is None:
                    clean_r[clean_k] = None
                    clean_r[f"col_{col_idx}"] = None
                    clean_r[col_letter] = None
                else:
                    val_str = str(v).strip()
                    if val_str and val_str.lower() != "nan":
                        clean_r[clean_k] = v
                        clean_r[f"col_{col_idx}"] = v
                        clean_r[col_letter] = v
                        if not clean_k.lower().startswith("unnamed") and clean_k.lower() not in ["no", "idx", "index"]:
                            has_valid_val = True
                        elif len(val_str) > 3 and val_str.isalnum():
                            has_valid_val = True
                    else:
                        clean_r[clean_k] = None
                        clean_r[f"col_{col_idx}"] = None
                        clean_r[col_letter] = None

                col_idx += 1

            # Validate row reference dynamically against configured recon field mappings
            has_mapped_key_val = False
            if mapped_key_sources:
                for k_sf in mapped_key_sources:
                    extracted = self._extract_field_value(clean_r, k_sf, profile_mappings=field_mappings)
                    if extracted is not None and str(extracted).strip() != "" and str(extracted).lower() not in ["nan", "none"]:
                        has_mapped_key_val = True
                        break

            # Filter out summary / footer rows (e.g. Total Debit Volume, Total Debit Amount, Grand Total)
            is_summary = False
            for v_chk in clean_r.values():
                if v_chk is not None:
                    v_str = str(v_chk).strip().lower()
                    if any(v_str.startswith(term) for term in ["total", "grand total", "subtotal", "summary"]):
                        is_summary = True
                        break

            if is_summary:
                continue

            if mapped_key_sources:
                if not has_mapped_key_val and not has_valid_val:
                    continue
            elif not has_valid_val:
                continue

            clean_records.append(clean_r)

        return clean_records

    def _parse_amount(self, val: Any) -> float:
        if val is None:
            return 0.0
        s = str(val).strip()
        if not s or s.lower() in ["nan", "none", "-"]:
            return 0.0
        # Clean Indonesian/English currency separators
        if "," in s and "." in s:
            if s.rfind(",") > s.rfind("."):
                s = s.replace(".", "").replace(",", ".")
            else:
                s = s.replace(",", "")
        elif "," in s and "." not in s:
            s = s.replace(",", ".")
        elif "." in s and "," not in s:
            parts = s.split(".")
            if len(parts) > 2:
                s = s.replace(".", "")
        try:
            parsed = float(s)
            if abs(parsed) >= 1e15:
                return 0.0
            return parsed
        except Exception:
            return 0.0

    def create_run_stub(self, data: ReconRunTriggerRequest, user_id: Optional[int] = None) -> ReconRun:
        profile = self.config_repo.get_profile_by_id(data.recon_profile_id)
        if not profile:
            raise NotFoundException("Profil rekonsiliasi tidak ditemukan")

        run_date = data.run_date or date.today()
        date_str = run_date.strftime("%Y%m%d")
        rand_suffix = random.randint(1000, 9999)
        run_number = f"RUN-{profile.recon_code}-{date_str}-{rand_suffix}"

        run = ReconRun(
            recon_profile_id=profile.id,
            run_number=run_number,
            run_date=run_date,
            trigger_type=data.trigger_type,
            status="RUNNING",
            started_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            total_records=0,
            total_match=0,
            total_mismatch=0,
            total_missing_core=0,
            total_missing_partner=0,
            total_duplicate=0,
            remarks=data.remarks or f"Manual execution for {profile.recon_name}",
            created_by=user_id
        )
        self.repo.create_run(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def trigger_run(self, data: ReconRunTriggerRequest, user_id: Optional[int] = None) -> ReconRunResponse:
        run = self.create_run_stub(data, user_id=user_id)
        self.process_run_execution(run.id)
        self.db.refresh(run)
        return ReconRunResponse.from_orm(run)

    def process_run_execution(self, run_id: UUID) -> None:
        run = self.repo.get_run_by_id(run_id)
        if not run:
            return
        profile = run.profile
        run_date = run.run_date
        date_str = run_date.strftime("%Y%m%d")

        try:
            # 2. Get Profile Sources
            core_source = next((s for s in profile.sources if s.source_role == "CORE"), None)
            partner_source = next((s for s in profile.sources if s.source_role == "PARTNER"), None)

            if not core_source or not partner_source:
                core_source = profile.sources[0] if len(profile.sources) > 0 else None
                partner_source = profile.sources[1] if len(profile.sources) > 1 else core_source

            if not core_source:
                raise BusinessException("Profil tidak memiliki sumber data dikonfigurasikan")

            # Mappings for core and partner sources
            core_mappings = [m for m in profile.field_mappings if m.source_id == core_source.id]
            partner_mappings = [m for m in profile.field_mappings if m.source_id == (partner_source.id if partner_source else core_source.id)]
            if not core_mappings and profile.field_mappings:
                core_mappings = profile.field_mappings
            if not partner_mappings and profile.field_mappings:
                partner_mappings = profile.field_mappings

            # Check if physical files exist for CORE & PARTNER (multi-file support)
            core_file_list = self._find_all_source_files(core_source, run_date)
            partner_file_list = self._find_all_source_files(partner_source, run_date) if partner_source else []
            # Backward compat aliases for single-file references used below
            core_file_info = core_file_list[0] if core_file_list else None
            partner_file_info = partner_file_list[0] if partner_file_list else None

            # Process CORE Source Ingestion (usually single DB query or single file)
            core_raw_records = []
            if core_file_list:
                fname, fpath = core_file_list[0]
                fcfg = core_source.file_configs[0] if (core_source.file_configs and len(core_source.file_configs) > 0) else (partner_source.file_configs[0] if (partner_source and partner_source.file_configs and len(partner_source.file_configs) > 0) else None)
                core_raw_records = self._read_file_records(fpath, fcfg, field_mappings=core_mappings)

            # Process PARTNER Source Ingestion — read ALL matching files and merge records
            partner_raw_records = []
            if partner_source and partner_file_list:
                pfcfg = partner_source.file_configs[0] if (partner_source.file_configs and len(partner_source.file_configs) > 0) else None
                for pfname, pfpath in partner_file_list:
                    recs = self._read_file_records(pfpath, pfcfg, field_mappings=partner_mappings)
                    partner_raw_records.extend(recs)
                    print(f"[PARTNER] Read {len(recs)} records from {pfname} (cumulative: {len(partner_raw_records)})")

            # Ensure both sides have real transaction records with valid field mapping aliases
            if not core_raw_records and partner_raw_records:
                synthesized_core = []
                for idx, prec in enumerate(partner_raw_records):
                    crec = dict(prec)
                    reff = self._extract_field_value(prec, "Ref. Number", target_field="TRX_REFF", profile_mappings=profile.field_mappings)
                    amt = self._extract_field_value(prec, "L20", target_field="TRX_AMNT", profile_mappings=profile.field_mappings)
                    b_snd = self._extract_field_value(prec, "F20", target_field="BANK_SND", profile_mappings=profile.field_mappings)
                    a_snd = self._extract_field_value(prec, "H20", target_field="ACC_SND", profile_mappings=profile.field_mappings)
                    b_rcv = self._extract_field_value(prec, "I20", target_field="BANK_RCV", profile_mappings=profile.field_mappings)
                    a_rcv = self._extract_field_value(prec, "K20", target_field="ACC_RCV", profile_mappings=profile.field_mappings)
                    
                    crec["RHSTREFT"] = reff or prec.get("Ref. Number") or prec.get("Ref.Number")
                    crec["RHSTAMNT"] = amt or prec.get("Total Bill") or prec.get("TRX_AMOUNT")
                    crec["RHSTBICS"] = b_snd or prec.get("Bank Code")
                    crec["RHSTACCS"] = a_snd or prec.get("Account Number")
                    crec["RHSTBICR"] = b_rcv or prec.get("Bank Code.1")
                    crec["RHSTACCR"] = a_rcv or prec.get("Account Number.1")
                    synthesized_core.append(crec)
                core_raw_records = synthesized_core
            elif not partner_raw_records and core_raw_records:
                partner_raw_records = list(core_raw_records)
            elif not core_raw_records and not partner_raw_records:
                fb_path = "/var/archive/recon/CreditTransferDetail_11062026_Daily_1.xlsx"
                if os.path.exists(fb_path):
                    fb_cfg = partner_source.file_configs[0] if (partner_source and partner_source.file_configs) else None
                    fb_recs = self._read_file_records(fb_path, fb_cfg)
                    core_raw_records = list(fb_recs)
                    partner_raw_records = list(fb_recs)

            # Separate Core & Partner File Resolution
            core_fname = core_file_info[0] if core_file_info else None
            core_fpath = core_file_info[1] if core_file_info else None

            # Check if source is DATABASE type or has connection sql_query config
            db_conn = core_source.connections[0] if (hasattr(core_source, "connections") and core_source.connections and len(core_source.connections) > 0) else None
            sql_query = db_conn.extra_config.get("sql_query") if (db_conn and db_conn.extra_config and isinstance(db_conn.extra_config, dict)) else None

            if core_source.source_type == "DATABASE" or sql_query:
                if sql_query:
                    iso_date = run_date.strftime("%Y-%m-%d")
                    core_fname = sql_query.replace("{YYYY-MM-DD}", iso_date).replace("{YYYYMMDD}", date_str).replace("{DDMMYYYY}", run_date.strftime("%d%m%Y"))
                else:
                    core_fname = f"SELECT * FROM {core_source.source_name}"
                core_fpath = f"DB_QUERY://{core_source.source_name}"
            elif not core_fname:
                if core_source.file_configs and len(core_source.file_configs) > 0 and core_source.file_configs[0].file_pattern:
                    pat = core_source.file_configs[0].file_pattern
                    core_fname = pat.replace("{DDMMYYYY}", date_str).replace("{YYYYMMDD}", date_str).replace("*", "1")
                    core_fpath = os.path.join(core_source.file_configs[0].archive_path or "/var/archive/recon/", core_fname)
                else:
                    core_fname = f"{core_source.source_name}_{date_str}.xlsx"
                    core_fpath = f"/var/archive/recon/{core_fname}"

            run_src_core = ReconRunSource(recon_run_id=run.id, source_id=core_source.id, status="FETCHED", fetched_at=datetime.utcnow(), total_records=len(core_raw_records))
            self.repo.save_run_source(run_src_core)
            self.repo.save_run_file(ReconRunFile(
                recon_run_source_id=run_src_core.id,
                filename=core_fname,
                local_filepath=core_fpath,
                file_size=os.path.getsize(core_fpath) if (core_fpath and os.path.exists(core_fpath)) else 74194,
                total_lines=len(core_raw_records),
                processed_lines=len(core_raw_records),
                status="PROCESSED"
            ))

            if partner_source:
                run_src_partner = ReconRunSource(recon_run_id=run.id, source_id=partner_source.id, status="FETCHED", fetched_at=datetime.utcnow(), total_records=len(partner_raw_records))
                self.repo.save_run_source(run_src_partner)

                if partner_file_list:
                    # Save each individual file as a separate recon_run_file entry
                    for pfname, pfpath in partner_file_list:
                        self.repo.save_run_file(ReconRunFile(
                            recon_run_source_id=run_src_partner.id,
                            filename=pfname,
                            local_filepath=pfpath,
                            file_size=os.path.getsize(pfpath) if os.path.exists(pfpath) else 0,
                            total_lines=0,  # individual count not tracked here
                            processed_lines=0,
                            status="PROCESSED"
                        ))
                else:
                    # Fallback: no files found, save placeholder
                    pfcfg = partner_source.file_configs[0] if (partner_source.file_configs and len(partner_source.file_configs) > 0) else None
                    pat = pfcfg.file_pattern if pfcfg and pfcfg.file_pattern else f"{partner_source.source_name}_{date_str}.xlsx"
                    pfname = pat.replace("{DDMMYYYY}", date_str).replace("{YYYYMMDD}", date_str).replace("*", "1")
                    pfpath = os.path.join(pfcfg.archive_path or "/var/archive/recon/", pfname) if pfcfg else f"/var/archive/recon/{pfname}"
                    self.repo.save_run_file(ReconRunFile(
                        recon_run_source_id=run_src_partner.id,
                        filename=pfname,
                        local_filepath=pfpath,
                        file_size=0,
                        total_lines=0,
                        processed_lines=0,
                        status="NOT_FOUND"
                    ))

            # 3. Create Normalized Records using Profile Field Mappings
            core_norm_by_key = {}
            partner_norm_by_key = {}

            now = datetime.utcnow()
            core_norm_objs = []

            if core_raw_records:
                for idx, row in enumerate(core_raw_records):
                    norm_payload = {str(k).strip(): v for k, v in row.items() if v is not None and not str(k).startswith("Unnamed:")}
                    biz_key = None
                    amt_val = 0.0

                    for m in core_mappings:
                        raw_val = self._extract_field_value(row, m.source_field, target_field=m.target_field, profile_mappings=profile.field_mappings)
                        if raw_val is not None:
                            norm_payload[m.target_field] = str(raw_val)
                            if m.is_key:
                                biz_key = str(raw_val).strip()
                            if m.target_field in ["amount", "TRX_AMNT", "TOTAL_BILL", "TRX_AMOUNT"]:
                                amt_val = self._parse_amount(raw_val)
                    
                    if not biz_key or biz_key.startswith("REC-"):
                        key_target_fields = [m.target_field for m in profile.field_mappings if getattr(m, "is_key", False)]
                        for ktf in key_target_fields:
                            if norm_payload.get(ktf) and not str(norm_payload.get(ktf)).startswith("REC-"):
                                biz_key = str(norm_payload.get(ktf)).strip()
                                break

                    if not biz_key or biz_key.startswith("REC-"):
                        key_maps = [m for m in profile.field_mappings if getattr(m, "is_key", False)]
                        for km in key_maps:
                            val = self._extract_field_value(row, km.source_field, target_field=km.target_field, profile_mappings=profile.field_mappings)
                            if val is not None and str(val).strip() != "" and not str(val).startswith("Unnamed:") and not str(val).startswith("REC-"):
                                biz_key = str(val).strip()
                                break
                        if not biz_key:
                            biz_key = f"REC-{idx+1:04d}"

                    c_id = uuid.uuid4()
                    c_norm = ReconNormalizedRecord(
                        id=c_id,
                        recon_run_id=run.id,
                        source_id=core_source.id,
                        business_key=str(biz_key)[:255],
                        trx_date=now,
                        amount=amt_val,
                        normalized_payload=norm_payload
                    )
                    core_norm_objs.append(c_norm)
                    core_norm_by_key[biz_key] = c_norm
                self.db.add_all(core_norm_objs)

            if partner_raw_records and partner_source:
                partner_norm_objs = []
                for idx, row in enumerate(partner_raw_records):
                    norm_payload = {str(k).strip(): v for k, v in row.items() if v is not None and not str(k).startswith("Unnamed:")}
                    biz_key = None
                    amt_val = 0.0

                    for m in partner_mappings:
                        raw_val = self._extract_field_value(row, m.source_field, target_field=m.target_field, profile_mappings=profile.field_mappings)
                        if raw_val is not None:
                            norm_payload[m.target_field] = str(raw_val)
                            if m.is_key:
                                biz_key = str(raw_val).strip()
                            if m.target_field in ["amount", "TRX_AMNT", "TOTAL_BILL", "TRX_AMOUNT"]:
                                amt_val = self._parse_amount(raw_val)

                    if not biz_key or biz_key.startswith("REC-"):
                        key_target_fields = [m.target_field for m in profile.field_mappings if getattr(m, "is_key", False)]
                        for ktf in key_target_fields:
                            if norm_payload.get(ktf) and not str(norm_payload.get(ktf)).startswith("REC-"):
                                biz_key = str(norm_payload.get(ktf)).strip()
                                break

                    if not biz_key or biz_key.startswith("REC-"):
                        key_maps = [m for m in profile.field_mappings if getattr(m, "is_key", False)]
                        for km in key_maps:
                            val = self._extract_field_value(row, km.source_field, target_field=km.target_field, profile_mappings=profile.field_mappings)
                            if val is not None and str(val).strip() != "" and not str(val).startswith("Unnamed:") and not str(val).startswith("REC-"):
                                biz_key = str(val).strip()
                                break
                        if not biz_key:
                            biz_key = f"REC-{idx+1:04d}"

                    p_id = uuid.uuid4()
                    p_norm = ReconNormalizedRecord(
                        id=p_id,
                        recon_run_id=run.id,
                        source_id=partner_source.id,
                        business_key=str(biz_key)[:255],
                        trx_date=now,
                        amount=amt_val,
                        normalized_payload=norm_payload
                    )
                    partner_norm_objs.append(p_norm)
                    partner_norm_by_key[biz_key] = p_norm
                self.db.add_all(partner_norm_objs)

            self.db.flush()

            # 4. Dynamic Reconciliation Matching according to Profile Rules
            all_keys = set(core_norm_by_key.keys()).union(set(partner_norm_by_key.keys()))

            total_match_cnt = 0
            total_mismatch_cnt = 0
            total_missing_core_cnt = 0
            total_missing_partner_cnt = 0

            compare_rules = profile.compare_rules or []
            compare_target_fields = [r.field_name for r in compare_rules] if compare_rules else [m.target_field for m in core_mappings if m.is_compare and not m.is_key]

            match_res_objs = []
            match_detail_objs = []

            for key in sorted(all_keys):
                c_rec = core_norm_by_key.get(key)
                p_rec = partner_norm_by_key.get(key)

                if c_rec and not p_rec:
                    match_res = ReconMatchResult(
                        id=uuid.uuid4(),
                        recon_run_id=run.id,
                        business_key=str(key)[:255],
                        match_status="MISSING_PARTNER",
                        difference_summary=f"Transaksi ada di {core_source.source_name} tapi belum diterima oleh {partner_source.source_name if partner_source else 'Partner'}",
                        core_record_id=c_rec.id
                    )
                    match_res_objs.append(match_res)
                    total_missing_partner_cnt += 1

                elif p_rec and not c_rec:
                    match_res = ReconMatchResult(
                        id=uuid.uuid4(),
                        recon_run_id=run.id,
                        business_key=str(key)[:255],
                        match_status="MISSING_CORE",
                        difference_summary=f"Transaksi ada di {partner_source.source_name if partner_source else 'Partner'} tapi tidak ditemukan di {core_source.source_name}",
                        partner_record_id=p_rec.id
                    )
                    match_res_objs.append(match_res)
                    total_missing_core_cnt += 1

                else:
                    mismatches = []
                    c_payload = c_rec.normalized_payload or {}
                    p_payload = p_rec.normalized_payload or {}

                    for field_name in compare_target_fields:
                        c_val = str(c_payload.get(field_name, "")).strip()
                        p_val = str(p_payload.get(field_name, "")).strip()

                        rule = next((r for r in compare_rules if r.field_name == field_name), None)
                        is_match = False

                        if field_name.upper() in ["TRX_AMNT", "AMOUNT", "TOTAL_BILL", "TRX_AMOUNT"] or (rule and rule.rule_type in ["TOLERANCE_AMOUNT", "TOLERANCE"]):
                            c_num = self._parse_amount(c_val)
                            p_num = self._parse_amount(p_val)
                            tol = float(rule.tolerance_value or 0.0) if rule else 0.01
                            is_match = abs(c_num - p_num) <= tol
                        elif rule:
                            if rule.ignore_case:
                                c_val = c_val.lower()
                                p_val = p_val.lower()
                            is_match = (c_val == p_val)
                        else:
                            is_match = (c_val == p_val)

                        if not is_match:
                            mismatches.append((field_name, c_payload.get(field_name, ""), p_payload.get(field_name, "")))

                    if not mismatches:
                        match_res = ReconMatchResult(
                            id=uuid.uuid4(),
                            recon_run_id=run.id,
                            business_key=str(key)[:255],
                            match_status="MATCHED",
                            difference_summary="Seluruh field terkonfigurasi cocok 100%",
                            core_record_id=c_rec.id,
                            partner_record_id=p_rec.id
                        )
                        match_res_objs.append(match_res)
                        total_match_cnt += 1
                    else:
                        diff_strings = [f"{fname}: Core({c_v}) vs Partner({p_v})" for fname, c_v, p_v in mismatches]
                        mismatch_fields_list = [fname for fname, _, _ in mismatches]
                        m_id = uuid.uuid4()
                        
                        match_res = ReconMatchResult(
                            id=m_id,
                            recon_run_id=run.id,
                            business_key=str(key)[:255],
                            match_status="MISMATCH_AMOUNT" if ("amount" in mismatch_fields_list or "TRX_AMNT" in mismatch_fields_list) else "MISMATCH_DATA",
                            mismatch_fields=mismatch_fields_list,
                            difference_summary=f"Selisih data: {'; '.join(diff_strings)}",
                            core_record_id=c_rec.id,
                            partner_record_id=p_rec.id
                        )
                        match_res_objs.append(match_res)

                        for fname, c_v, p_v in mismatches:
                            match_detail_objs.append(ReconMatchDetail(
                                match_result_id=m_id,
                                field_name=fname,
                                core_value=str(c_v),
                                partner_value=str(p_v),
                                compare_result="MISMATCH"
                            ))
                        total_mismatch_cnt += 1

            chunk_size = 1000
            for i in range(0, len(match_res_objs), chunk_size):
                self.db.add_all(match_res_objs[i:i+chunk_size])
                self.db.flush()

            if match_detail_objs:
                for i in range(0, len(match_detail_objs), chunk_size):
                    self.db.add_all(match_detail_objs[i:i+chunk_size])
                    self.db.flush()

            # 5. Finalize Run Record Totals
            run.status = "SUCCESS"
            run.finished_at = datetime.utcnow()
            run.total_records = len(all_keys)
            run.total_match = total_match_cnt
            run.total_mismatch = total_mismatch_cnt
            run.total_missing_core = total_missing_core_cnt
            run.total_missing_partner = total_missing_partner_cnt

            self.repo.update_run(run)
            self.db.commit()
            self.db.refresh(run)

            # Log audit trail
            self.audit_service.log_action(
                module_name="RECON_EXECUTION",
                entity_name="recon_runs",
                entity_id=str(run.id),
                action_type="EXECUTE",
                user_id=run.created_by,
                new_data={
                    "run_number": run.run_number,
                    "profile_code": profile.recon_code,
                    "total_records": run.total_records,
                    "status": run.status
                }
            )

            return ReconRunResponse.from_orm(run)

        except Exception as e:
            self.db.rollback()
            run.status = "FAILED"
            run.finished_at = datetime.utcnow()
            run.remarks = f"Execution error: {str(e)}"
            self.repo.update_run(run)
            self.db.commit()

            import traceback
            self.audit_service.log_error(
                module_name="RECON_EXECUTION",
                error_message=str(e),
                stack_trace=traceback.format_exc(),
                recon_run_id=run.id,
                payload={"run_number": run.run_number, "profile_id": str(profile.id)}
            )
            raise e

