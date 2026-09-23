from typing import List
from datetime import datetime, timedelta
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    ReconTrendPoint,
    ProfileBreakdownItem,
    RecentRunItem,
)

# -------------------------------------------------------------------
# MOCK RAW DATA (Menyimulasikan baris data mentah dari Database)
# -------------------------------------------------------------------
RAW_RECON_RUNS = [
    {
        "run_id": "#RUN-99201",
        "profile_id": 1,
        "profile_name": "PLN Settlement",
        "matched": 18200,
        "mismatch": 1500,
        "unmatched": 300,
        "status": "SUCCESS",
        "created_at": datetime(2026, 9, 23, 10, 15, 0)  # Rabu (23 Sep)
    },
    {
        "run_id": "#RUN-99200",
        "profile_id": 2,
        "profile_name": "QRIS Merchant",
        "matched": 80100,
        "mismatch": 1000,
        "unmatched": 300,
        "status": "SUCCESS",
        "created_at": datetime(2026, 9, 22, 16, 45, 0)  # Selasa (22 Sep)
    },
    {
        "run_id": "#RUN-99199",
        "profile_id": 3,
        "profile_name": "ATM Cash-In",
        "matched": 40100,
        "mismatch": 7000,
        "unmatched": 200,
        "status": "PENDING",
        "created_at": datetime(2026, 9, 21, 11, 30, 0)  # Senin (21 Sep)
    },
    {
        "run_id": "#RUN-99198",
        "profile_id": 1,
        "profile_name": "PLN Settlement",
        "matched": 110000,
        "mismatch": 18000,
        "unmatched": 200,
        "status": "SUCCESS",
        "created_at": datetime(2026, 9, 20, 14, 20, 0)  # Minggu (20 Sep)
    },
    {
        "run_id": "#RUN-99197",
        "profile_id": 4,
        "profile_name": "Interbank Transfer",
        "matched": 37000,
        "mismatch": 2000,
        "unmatched": 1000,
        "status": "FAILED",
        "created_at": datetime(2026, 9, 19, 9, 10, 0)   # Sabtu (19 Sep)
    },
    {
        "run_id": "#RUN-99196",
        "profile_id": 2,
        "profile_name": "QRIS Merchant",
        "matched": 42500,
        "mismatch": 1200,
        "unmatched": 400,
        "status": "SUCCESS",
        "created_at": datetime(2026, 9, 18, 15, 30, 0)  # Jumat (18 Sep)
    },
    {
        "run_id": "#RUN-99195",
        "profile_id": 1,
        "profile_name": "PLN Settlement",
        "matched": 25000,
        "mismatch": 800,
        "unmatched": 200,
        "status": "SUCCESS",
        "created_at": datetime(2026, 9, 17, 0, 15, 0)  # Kamis (17 Sep)
    },
]

# -------------------------------------------------------------------
# RAW DISCREPANCIES (Nilai Tidak Diubah)
# -------------------------------------------------------------------
RAW_DISCREPANCIES = [
    {"id": 101, "trx_ref": "TRX-PLN-001", "profile": "PLN Settlement", "amount": 100000.0, "status": "MISMATCH"},
    {"id": 102, "trx_ref": "TRX-QRIS-088", "profile": "QRIS Merchant", "amount": 1500000.0, "status": "MISMATCH"},
    {"id": 103, "trx_ref": "TRX-ATM-991", "profile": "ATM Cash-In", "amount": 8450000.0, "status": "MISMATCH"},
    {"id": 104, "trx_ref": "TRX-PLN-045", "profile": "PLN Settlement", "amount": 12500000.0, "status": "MISMATCH"},
    {"id": 105, "trx_ref": "TRX-TRF-302", "profile": "Interbank Transfer", "amount": 4500000.0, "status": "MISMATCH"},
    {"id": 106, "trx_ref": "TRX-ATM-104", "profile": "ATM Cash-In", "amount": 3200000.0, "status": "MISMATCH"},
    {"id": 107, "trx_ref": "TRX-QRIS-512", "profile": "QRIS Merchant", "amount": 750000.0, "status": "MISMATCH"},
    {"id": 108, "trx_ref": "TRX-PLN-901", "profile": "PLN Settlement", "amount": 0.0, "status": "MATCHED"},
]

# -------------------------------------------------------------------
# RAW APPROVALS (Nilai Tidak Diubah)
# -------------------------------------------------------------------
RAW_APPROVALS = [
    {"id": 1, "run_id": "#RUN-99199", "type": "Force Match", "requester": "Operator A", "status": "PENDING"},
    {"id": 2, "run_id": "#RUN-99198", "type": "Write-Off Discrepancy", "requester": "Supervisor B", "status": "PENDING"},
    {"id": 3, "run_id": "#RUN-99197", "type": "Manual Adjustment", "requester": "Operator C", "status": "PENDING"},
    {"id": 4, "run_id": "#RUN-99199", "type": "Refund Approval", "requester": "Operator A", "status": "PENDING"},
    {"id": 5, "run_id": "#RUN-99201", "type": "Force Match", "requester": "Supervisor B", "status": "APPROVED"},
    {"id": 6, "run_id": "#RUN-99200", "type": "Manual Adjustment", "requester": "Operator A", "status": "REJECTED"},
]

# -------------------------------------------------------------------
# SERVICE CLASS WITH ACTUAL CALCULATION LOGIC
# -------------------------------------------------------------------
class DashboardService:

    @staticmethod
    async def get_summary_metrics() -> DashboardSummaryResponse:
        """
        LOGIKA PERHITUNGAN:
        1. Total Transactions = Sum of (matched + mismatch + unmatched)
        2. Match Rate % = (Total Matched / Total Transactions) * 100
        3. Discrepancy Amount = Sum of amount where status == 'MISMATCH'
        """
        # 1. Hitung total transaksi dan total matched dari data raw
        total_matched = sum(item["matched"] for item in RAW_RECON_RUNS)
        total_mismatch = sum(item["mismatch"] for item in RAW_RECON_RUNS)
        total_unmatched = sum(item["unmatched"] for item in RAW_RECON_RUNS)
        
        total_transactions = total_matched + total_mismatch + total_unmatched

        # LOGIC: Match Rate Percentage (Proteksi division by zero)
        if total_transactions > 0:
            match_rate = round((total_matched / total_transactions) * 100, 1)
        else:
            match_rate = 0.0

        # 2. Hitung selisih nominal & count mismatch
        mismatch_items = [d for d in RAW_DISCREPANCIES if d["status"] == "MISMATCH"]
        discrepancy_amount = sum(d["amount"] for d in mismatch_items)
        discrepancy_count = len(mismatch_items)

        # 3. Hitung pending approvals
        pending_approvals = len([a for a in RAW_APPROVALS if a["status"] == "PENDING"])

        return DashboardSummaryResponse(
            total_transactions=total_transactions,
            match_rate_percentage=match_rate,
            discrepancy_amount=discrepancy_amount,
            discrepancy_count=discrepancy_count,
            pending_approvals=pending_approvals
        )

    @staticmethod
    async def get_reconciliation_trends(days: int = 7) -> List[ReconTrendPoint]:
        """
        LOGIKA PERHITUNGAN TREN:
        Mengelompokkan data berdasarkan tanggal unik dan menjumlahkan metriknya.
        """
        grouped_trends = {}

        for run in RAW_RECON_RUNS:
            date_key = run["created_at"].strftime("%d %b") # Format: '23 Sep'
            
            if date_key not in grouped_trends:
                grouped_trends[date_key] = {"matched": 0, "mismatch": 0, "unmatched": 0}
            
            grouped_trends[date_key]["matched"] += run["matched"]
            grouped_trends[date_key]["mismatch"] += run["mismatch"]
            grouped_trends[date_key]["unmatched"] += run["unmatched"]

        # Susun output berbasis array
        return [
            ReconTrendPoint(
                date=date_str,
                matched_count=metrics["matched"],
                mismatch_count=metrics["mismatch"],
                unmatched_count=metrics["unmatched"]
            )
            for date_str, metrics in grouped_trends.items()
        ]

    @staticmethod
    async def get_profile_breakdown() -> List[ProfileBreakdownItem]:
        """
        LOGIKA PERHITUNGAN DONUT CHART:
        1. Agregasi total records per profile_id
        2. Hitung grand total seluruh records
        3. Hitung % porsi = (Total Records Profil / Grand Total) * 100
        """
        profiles_map = {}

        for run in RAW_RECON_RUNS:
            pid = run["profile_id"]
            pname = run["profile_name"]
            run_total = run["matched"] + run["mismatch"] + run["unmatched"]

            if pid not in profiles_map:
                profiles_map[pid] = {"name": pname, "total": 0}
            
            profiles_map[pid]["total"] += run_total

        # LOGIC: Hitung Grand Total
        grand_total = sum(p["total"] for p in profiles_map.values()) or 1

        # LOGIC: Buat list hasil kalkulasi persentase
        result = []
        for pid, pdata in profiles_map.items():
            percentage = round((pdata["total"] / grand_total) * 100, 1)
            result.append(
                ProfileBreakdownItem(
                    profile_id=pid,
                    profile_name=pdata["name"],
                    percentage=percentage,
                    total_records=pdata["total"]
                )
            )

        return result

    @staticmethod
    async def get_recent_runs(limit: int = 5) -> List[RecentRunItem]:
        """
        LOGIKA RIWAYAT TERBARU:
        Sorting data descending berdasarkan `created_at` lalu ambil sejumlah `limit`.
        """
        sorted_runs = sorted(RAW_RECON_RUNS, key=lambda x: x["created_at"], reverse=True)
        limited_runs = sorted_runs[:limit]

        return [
            RecentRunItem(
                run_id=run["run_id"],
                profile_name=run["profile_name"],
                total_data=run["matched"] + run["mismatch"] + run["unmatched"],
                matched_data=run["matched"],
                status=run["status"],
                created_at=run["created_at"].strftime("%Y-%m-%d %H:%M")
            )
            for run in limited_runs
        ]