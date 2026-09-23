"use client";

import { DashboardSummaryResponse } from "@/types/dashboard";

interface Props {
  data: DashboardSummaryResponse | null;
  loading: boolean;
}

export default function DashboardKpiCards({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl p-4" />
        ))}
      </div>
    );
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("id-ID").format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Transaksi */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transaksi</p>
        <p className="text-2xl font-bold text-slate-900 mt-2">
          {data ? `${formatNumber(data.total_transactions)} Trx` : "0 Trx"}
        </p>
        <p className="text-xs text-emerald-600 font-medium mt-1">▲ (+12.4% vs 7d)</p>
      </div>

      {/* Card 2: Match Rate */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Match Rate (%)</p>
        <p className="text-2xl font-bold text-emerald-600 mt-2">
          {data ? `${data.match_rate_percentage}%` : "0%"}
        </p>
        <p className="text-xs text-slate-500 mt-1">(Target KPI: 98.0%)</p>
      </div>

      {/* Card 3: Nilai Selisih */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Selisih</p>
        <p className="text-2xl font-bold text-amber-600 mt-2">
          {data ? formatRupiah(data.discrepancy_amount) : "Rp 0"}
        </p>
        <p className="text-xs text-amber-600 font-medium mt-1">
          ({data ? data.discrepancy_count : 0} Records Discrepancy)
        </p>
      </div>

      {/* Card 4: Action Needed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Needed</p>
        <p className="text-2xl font-bold text-rose-600 mt-2">
          {data ? `${data.pending_approvals} Approval Req` : "0 Req"}
        </p>
        <p className="text-xs text-rose-500 font-medium mt-1">(Need Review & Action)</p>
      </div>
    </div>
  );
}