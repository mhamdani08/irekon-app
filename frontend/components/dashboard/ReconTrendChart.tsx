"use client";

import { ReconTrendPoint } from "@/types/dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: ReconTrendPoint[];
  loading: boolean;
}

// Custom Tooltip Recharts agar styling persis seperti desain semula
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const matched = payload.find((p: any) => p.dataKey === "matched_count")?.value || 0;
    const mismatch = payload.find((p: any) => p.dataKey === "mismatch_count")?.value || 0;
    const unmatched = payload.find((p: any) => p.dataKey === "unmatched_count")?.value || 0;

    return (
      <div className="bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-md space-y-0.5 border border-slate-800">
        <p className="font-bold border-b border-slate-700 pb-1 mb-1">{label}</p>
        <p className="text-emerald-400">Matched: {matched.toLocaleString("id-ID")}</p>
        <p className="text-amber-400">Mismatch: {mismatch.toLocaleString("id-ID")}</p>
        <p className="text-rose-400">Missing: {unmatched.toLocaleString("id-ID")}</p>
      </div>
    );
  }
  return null;
};

export default function ReconTrendChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-72 bg-slate-100 animate-pulse rounded-2xl p-4" />;
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      {/* Header & Indikator Warna Legenda */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Grafik Tren Rekonsiliasi Harian</h3>
          <p className="text-xs text-slate-500">Visualisasi perbandingan status transaksi</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Matched
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> Mismatch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span> Missing
          </span>
        </div>
      </div>

      {/* Visual Bar Chart Menggunakan Recharts */}
      <div className="h-52 w-full pt-2 border-b border-slate-100 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.6)" }} />
            
            {/* Stacked Bar (stackId="a" menyusun bar secara vertikal) */}
            <Bar
              dataKey="matched_count"
              stackId="a"
              fill="#10b981" // bg-emerald-500
              barSize={32}
            />
            <Bar
              dataKey="mismatch_count"
              stackId="a"
              fill="#f59e0b" // bg-amber-500
              barSize={32}
            />
            <Bar
              dataKey="unmatched_count"
              stackId="a"
              fill="#f43f5e" // bg-rose-500
              radius={[6, 6, 0, 0]} // Sudut membulat di bagian paling atas
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}