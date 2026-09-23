"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuthStore } from "@/store/authStore";
import { apiFetch } from "@/lib/api";
import { CheckCircle2, RefreshCw } from "lucide-react";

import DashboardKpiCards from "@/components/dashboard/DashboardKpiCards";
import ReconTrendChart from "@/components/dashboard/ReconTrendChart";
import ProfileBreakdownWidget from "@/components/dashboard/ProfileBreakdownWidget";
import RecentRunsTable from "@/components/dashboard/RecentRunsTable";
import QuickActionBar from "@/components/dashboard/QuickActionBar";

import {
  DashboardSummaryResponse,
  ReconTrendPoint,
  ProfileBreakdownItem,
  RecentRunItem,
} from "@/types/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth } = useAuthStore();

  // State Data Dashboard
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [trends, setTrends] = useState<ReconTrendPoint[]>([]);
  const [profileBreakdown, setProfileBreakdown] = useState<ProfileBreakdownItem[]>([]);
  const [recentRuns, setRecentRuns] = useState<RecentRunItem[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);

  // 1. Check Autentikasi User
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!isAuthenticated) {
      apiFetch<any>("/api/v1/auth/me")
        .then(async (res) => {
          if (res.data) {
            const menuRes = await apiFetch<any>("/api/v1/menus/user-menu");
            setAuth(res.data.user, res.data.permissions, menuRes.data || []);
          }
        })
        .catch(() => router.push("/login"));
    }
  }, [isAuthenticated, router, setAuth]);

  // 2. Fetch Data Dashboard dari Backend API
  const fetchDashboardData = async () => {
  try {
    setLoadingDashboard(true);
    
    const [resSummary, resTrends, resBreakdown, resRuns] = await Promise.all([
      apiFetch<any>("/api/v1/dashboard/summary"),
      apiFetch<any>("/api/v1/dashboard/trends?days=7"),
      apiFetch<any>("/api/v1/dashboard/profile-breakdown"),
      apiFetch<any>("/api/v1/dashboard/recent-runs?limit=5"),
    ]);

    // Cek di Console Browser (F12) untuk melihat struktur data aslinya
    console.log("Response Summary:", resSummary);

    // Ambil data (apakah ada di res.data atau langsung di res)
    const summaryData = resSummary?.data || resSummary;
    const trendsData = resTrends?.data || resTrends;
    const breakdownData = resBreakdown?.data || resBreakdown;
    const runsData = resRuns?.data || resRuns;

    if (summaryData) setSummary(summaryData);
    if (Array.isArray(trendsData)) setTrends(trendsData);
    if (Array.isArray(breakdownData)) setProfileBreakdown(breakdownData);
    if (Array.isArray(runsData)) setRecentRuns(runsData);

  } catch (error) {
    console.error("Gagal memuat data dashboard:", error);
  } finally {
    setLoadingDashboard(false);
  }
};

  useEffect(() => {
    if (isAuthenticated || user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-medium">
        Memuat sesi iRekon...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          {/* Header & Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Executive & Operations Dashboard
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Monitoring statistik rekonsiliasi real-time • Selamat datang, <span className="font-semibold text-slate-700">{user?.full_name}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>RBAC Engine Active</span>
              </div>

              <button
                onClick={fetchDashboardData}
                disabled={loadingDashboard}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDashboard ? "animate-spin" : ""}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Quick Action Bar */}
          <QuickActionBar />
          {/* 1. Top KPI Cards */}
          <DashboardKpiCards data={summary} loading={loadingDashboard} />

          {/* 2. Grid Charts (Trends & Profile Breakdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <ReconTrendChart data={trends} loading={loadingDashboard} />
            </div>
            <div>
              <ProfileBreakdownWidget data={profileBreakdown} loading={loadingDashboard} />
            </div>
          </div>

          {/* 3. Recent Runs Table */}
          <RecentRunsTable data={recentRuns} loading={loadingDashboard} />

          {/* 4. Permissions Badge (Optional Info) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Assigned Permissions & Capabilities</h2>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.flatMap((r) => r.permissions || []).map((p, idx) => (
                <span
                  key={idx}
                  style={{ backgroundColor: "rgba(0, 103, 71, 0.06)", borderColor: "rgba(0, 103, 71, 0.15)", color: "rgb(0, 103, 71)" }}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold"
                >
                  {p.permission_code}
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}