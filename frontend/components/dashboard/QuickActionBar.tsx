"use client";

import { useState } from "react";
import { Play, Upload, FileSpreadsheet } from "lucide-react";

export default function QuickActionBar() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunRecon = () => {
    alert("Navigasi ke halaman Pemicu Rekonsiliasi Baru (/reconciliation/new)");
  };

  const handleUploadFile = () => {
    alert("Buka Modal Upload File Rekonsiliasi (CSV/XLSX)");
  };

  const handleExportReport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      alert("Laporan Ringkasan Eksekutif (.pdf / .xlsx) berhasil diunduh!");
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Aksi Cepat Operasional</h3>
        <p className="text-xs text-slate-500">Pemicu proses, eksekusi berkas, dan ekspor ringkasan eksekutif</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        {/* Tombol 1: Trigger Rekonsiliasi Baru */}
        <button
          onClick={handleRunRecon}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xs transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Rekonsiliasi Baru</span>
        </button>

        {/* Tombol 2: Unggah File */}
        <button
          onClick={handleUploadFile}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 shadow-xs transition-all active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Unggah File</span>
        </button>

        {/* Tombol 3: Ekspor Laporan Ringkasan */}
        <button
          onClick={handleExportReport}
          disabled={isProcessing}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 shadow-xs transition-all active:scale-95 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{isProcessing ? "Mengekspor..." : "Ekspor Laporan"}</span>
        </button>
      </div>
    </div>
  );
}