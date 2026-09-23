from pydantic import BaseModel
from typing import List, Optional

# 1. Schema untuk Top 4 KPI Cards
class DashboardSummaryResponse(BaseModel):
    total_transactions: int
    match_rate_percentage: float
    discrepancy_amount: float  # Total nominal selisih (Rp)
    discrepancy_count: int     # Jumlah record selisih
    pending_approvals: int     # Action needed / pending review

# 2. Schema untuk Point Grafik Tren Harian (Matched vs Mismatch vs Unmatched)
class ReconTrendPoint(BaseModel):
    date: str                  # Format: "YYYY-MM-DD" atau nama hari "Senin"
    matched_count: int
    mismatch_count: int
    unmatched_count: int

# 3. Schema untuk Breakdown Profil Rekonsiliasi (PLN, QRIS, ATM, dll)
class ProfileBreakdownItem(BaseModel):
    profile_id: int
    profile_name: str          # Misal: "PLN Settlement", "QRIS Merchant"
    percentage: float          # Misal: 52.0
    total_records: int

class ProfileBreakdownResponse(BaseModel):
    items: List[ProfileBreakdownItem]

# 4. Schema untuk Item Riwayat Eksekusi Terbaru (5 eksekusi terakhir)
class RecentRunItem(BaseModel):
    run_id: str                # Misal: "#RUN-99201"
    profile_name: str
    total_data: int
    matched_data: int
    status: str                # Misal: "SUCCESS", "PENDING", "FAILED"
    created_at: str

# 5. Schema Utama jika ingin mengambil seluruh data dashboard sekaligus (Optional)
class DashboardFullResponse(BaseModel):
    summary: DashboardSummaryResponse
    trends: List[ReconTrendPoint]
    profile_breakdown: List[ProfileBreakdownItem]
    recent_runs: List[RecentRunItem]