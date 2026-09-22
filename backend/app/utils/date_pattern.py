from datetime import date, datetime, timedelta
import re
from typing import Optional

def resolve_dynamic_date_pattern(pattern: str, target_date: Optional[date] = None) -> str:
    """
    Resolves dynamic date tokens in a file pattern or SQL query template.
    
    Supported tokens:
    - {YYYYMMDD}   -> 20260731
    - {YYYY-MM-DD} -> 2026-07-31
    - {DDMMYYYY}   -> 31072026
    - {DD-MM-YYYY} -> 31-07-2026
    - {YYYYMM}     -> 202607
    - {YYMMDD}     -> 260731
    - {YYYYMMDD-1} -> Previous day 20260730
    - {YYYY-MM-DD-1} -> Previous day 2026-07-30
    """
    if not pattern:
        return pattern

    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, datetime):
        target_date = target_date.date()

    prev_date = target_date - timedelta(days=1)

    replacements = {
        "{YYYYMMDD}": target_date.strftime("%Y%m%d"),
        "{YYYY-MM-DD}": target_date.strftime("%Y-%m-%d"),
        "{DDMMYYYY}": target_date.strftime("%d%m%Y"),
        "{DD-MM-YYYY}": target_date.strftime("%d-%m-%Y"),
        "{YYYYMM}": target_date.strftime("%Y%m"),
        "{YYMMDD}": target_date.strftime("%y%m%d"),
        "{YYYYMMDD-1}": prev_date.strftime("%Y%m%d"),
        "{YYYY-MM-DD-1}": prev_date.strftime("%Y-%m-%d"),
    }

    resolved = pattern
    for token, replacement in replacements.items():
        resolved = resolved.replace(token, replacement)

    return resolved
