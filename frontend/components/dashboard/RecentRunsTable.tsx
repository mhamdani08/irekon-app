"use client";

import Link from "next/link";
import { RecentRunItem } from "@/types/dashboard";

interface Props {
  data: RecentRunItem[];
  loading: boolean;
}

export default function RecentRunsTable({ data, loading }: Props) {
  if (loading) {
    return <div className="h-64 bg-slate-100 animate-pulse rounded-2xl p-4" />;
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">SUCCESS</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">PENDING</span>;
      case "FAILED":
        return <span className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-full border border-rose-200">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Riwayat Eksekusi Rekonsiliasi Terbaru</h3>
          <p className="text-xs text-slate-500">5 aktivitas eksekusi proses rekonsiliasi terakhir</p>
        </div>
        <Link href="/reconciliation" className="text-xs font-semibold text-indigo-600 hover:underline">
          Lihat Semua →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Run ID</th>
              <th className="py-3 px-4">Profil Rekon</th>
              <th className="py-3 px-4">Total Data</th>
              <th className="py-3 px-4">Data Matched</th>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {data.map((item) => (
              <tr key={item.run_id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{item.run_id}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{item.profile_name}</td>
                <td className="py-3 px-4">{item.total_data.toLocaleString("id-ID")}</td>
                <td className="py-3 px-4 text-emerald-600 font-semibold">{item.matched_data.toLocaleString("id-ID")}</td>
                <td className="py-3 px-4 text-slate-500">{item.created_at}</td>
                <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                <td className="py-3 px-4 text-center">
                  <Link
                    href={`/reconciliation/${item.run_id}`}
                    className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-indigo-600 shadow-xs transition-all"
                  >
                    Detail Matrix
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}