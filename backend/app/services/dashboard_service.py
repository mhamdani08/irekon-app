from typing import List
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    ReconTrendPoint,
    ProfileBreakdownItem,
    RecentRunItem,
)

class DashboardService:
    @staticmethod
    async def get_summary_metrics() -> DashboardSummaryResponse:
        """
        Menghitung total data diproses, total match, total mismatch,
        total selisih nominal (Rp), dan pending approvals.
        """
        # TODO: Ganti dengan query SQLAlchemy ke tabel recon_runs, recon_match_results, recon_approvals
        return DashboardSummaryResponse(
            total_transactions=1450200,
            match_rate_percentage=98.6,
            discrepancy_amount=12450000.0,
            discrepancy_count=142,
            pending_approvals=8
        )

    @staticmethod
    async def get_reconciliation_trends(days: int = 7) -> List[ReconTrendPoint]:
        """
        Mengelompokkan statistik match/mismatch per tanggal untuk chart tren.
        """
        # TODO: Query database berdasarkan rentang hari (days)
        return [
            ReconTrendPoint(date="Senin", matched_count=120000, mismatch_count=1500, unmatched_count=500),
            ReconTrendPoint(date="Selasa", matched_count=135000, mismatch_count=1200, unmatched_count=300),
            ReconTrendPoint(date="Rabu", matched_count=140000, mismatch_count=2000, unmatched_count=400),
            ReconTrendPoint(date="Kamis", matched_count=128000, mismatch_count=1100, unmatched_count=200),
            ReconTrendPoint(date="Jumat", matched_count=150000, mismatch_count=1800, unmatched_count=600),
            ReconTrendPoint(date="Sabtu", matched_count=90000, mismatch_count=800, unmatched_count=100),
            ReconTrendPoint(date="Minggu", matched_count=85000, mismatch_count=700, unmatched_count=150),
        ]

    @staticmethod
    async def get_profile_breakdown() -> List[ProfileBreakdownItem]:
        """
        Agregasi persentase transaksi per jenis profil rekonsiliasi.
        """
        # TODO: Query database persentase per recon_profile_id
        return [
            ProfileBreakdownItem(profile_id=1, profile_name="PLN Settlement", percentage=52.0, total_records=754104),
            ProfileBreakdownItem(profile_id=2, profile_name="QRIS Merchant", percentage=28.0, total_records=406056),
            ProfileBreakdownItem(profile_id=3, profile_name="ATM Cash-In", percentage=20.0, total_records=290040),
        ]

    @staticmethod
    async def get_recent_runs(limit: int = 5) -> List[RecentRunItem]:
        """
        Mengambil N eksekusi rekonsiliasi terbaru beserta metrik ringkasannya.
        """
        # TODO: Query 5 baris terbaru dari tabel recon_runs ORDER BY created_at DESC
        return [
            RecentRunItem(
                run_id="#RUN-99201",
                profile_name="PLN Settlement",
                total_data=150000,
                matched_data=148200,
                status="SUCCESS",
                created_at="2026-03-30 10:15"
            ),
            RecentRunItem(
                run_id="#RUN-99200",
                profile_name="QRIS Merchant",
                total_data=85400,
                matched_data=84100,
                status="SUCCESS",
                created_at="2026-03-30 09:30"
            ),
            RecentRunItem(
                run_id="#RUN-99199",
                profile_name="ATM Cash-In",
                total_data=45000,
                matched_data=44100,
                status="PENDING",
                created_at="2026-03-30 08:45"
            ),
            RecentRunItem(
                run_id="#RUN-99198",
                profile_name="PLN Settlement",
                total_data=120000,
                matched_data=118000,
                status="SUCCESS",
                created_at="2026-03-29 17:00"
            ),
            RecentRunItem(
                run_id="#RUN-99197",
                profile_name="Interbank Transfer",
                total_data=60000,
                matched_data=57000,
                status="FAILED",
                created_at="2026-03-29 14:20"
            ),
        ]