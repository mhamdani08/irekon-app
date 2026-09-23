"use client";

import { useState } from "react";
import Link from "next/link";
import { RecentRunItem } from "@/types/dashboard";

interface Props {
  data: RecentRunItem[];
  loading: boolean;
}

export default function RecentRunsTable({ data, loading }: Props) {
  // State untuk menyimpan item yang sedang dipilih untuk dibuka di modal
  const [selectedRun, setSelectedRun] = useState<RecentRunItem | null>(null);

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
                  <button
                    type="button"
                    onClick={() => setSelectedRun(item)}
                    className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-indigo-600 shadow-xs transition-all cursor-pointer"
                  >
                    Detail Matrix
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL POP-UP DETAIL MATRIX */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {selectedRun.run_id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Matriks Rekonsiliasi - {selectedRun.profile_name}
                </h3>
                <p className="text-xs text-slate-500">Eksekusi pada: {selectedRun.created_at}</p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Matrix Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Total Transaksi</span>
                <span className="text-base font-bold text-slate-900">
                  {selectedRun.total_data.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                <span className="text-xs text-emerald-700 block mb-1">Data Matched</span>
                <span className="text-base font-bold text-emerald-700">
                  {selectedRun.matched_data.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100">
                <span className="text-xs text-rose-700 block mb-1">Data Mismatch (Selisih)</span>
                <span className="text-base font-bold text-rose-700">
                  {(selectedRun.total_data - selectedRun.matched_data).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                <span className="text-xs text-indigo-700 block mb-1">Akurasi Match Rate</span>
                <span className="text-base font-bold text-indigo-700">
                  {((selectedRun.matched_data / selectedRun.total_data) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Rincian Status Matriks */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 mb-6">
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Ringkasan Validasi System</h4>
              <div className="flex justify-between items-center text-xs text-slate-600 py-1 border-b border-slate-100">
                <span>Status Proses</span>
                <span>{getStatusBadge(selectedRun.status)}</span>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href={`/reconciliation/${selectedRun.run_id}`}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
              >
                Buka Halaman Audit Detail →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}