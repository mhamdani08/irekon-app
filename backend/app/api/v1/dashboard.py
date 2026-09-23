from fastapi import APIRouter, Query, status
from typing import List

from app.schemas.dashboard import (
    DashboardSummaryResponse,
    ReconTrendPoint,
    ProfileBreakdownItem,
    RecentRunItem,
)
from app.services.dashboard_service import DashboardService

# Inisialisasi APIRouter
router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Dashboard Summary Metrics",
    description="Mengembalikan 4 Top KPI Cards (Total Transaksi, Match Rate %, Total Selisih, dan Pending Approvals)."
)
async def get_dashboard_summary():
    return await DashboardService.get_summary_metrics()


@router.get(
    "/trends",
    response_model=List[ReconTrendPoint],
    status_code=status.HTTP_200_OK,
    summary="Get Reconciliation Trends",
    description="Mengembalikan data tren harian rekonsiliasi (Matched vs Mismatch vs Unmatched)."
)
async def get_dashboard_trends(
    days: int = Query(default=7, ge=1, le=30, description="Rentang hari tren harian (1-30 hari)")
):
    return await DashboardService.get_reconciliation_trends(days=days)


@router.get(
    "/profile-breakdown",
    response_model=List[ProfileBreakdownItem],
    status_code=status.HTTP_200_OK,
    summary="Get Profile Breakdown Statistics",
    description="Mengembalikan distribusi persentase transaksi berdasarkan jenis profil rekonsiliasi."
)
async def get_profile_breakdown():
    return await DashboardService.get_profile_breakdown()


@router.get(
    "/recent-runs",
    response_model=List[RecentRunItem],
    status_code=status.HTTP_200_OK,
    summary="Get Recent Reconciliation Runs",
    description="Mengembalikan N eksekusi rekonsiliasi terbaru beserta status dan metrik ringkasannya."
)
async def get_recent_runs(
    limit: int = Query(default=5, ge=1, le=20, description="Jumlah riwayat eksekusi yang diambil")
):
    return await DashboardService.get_recent_runs(limit=limit)