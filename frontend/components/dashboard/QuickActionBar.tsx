"use client";

import { useState } from "react";
import { Play, Upload, FileSpreadsheet, PlusCircle, Download, FileText, X } from "lucide-react";

export default function QuickActionBar() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFile = () => {
    alert("Buka Modal Upload File Rekonsiliasi (CSV/XLSX)");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
      setIsUploadOpen(false);
      setSelectedFile(null);
      alert(`File ${selectedFile.name} berhasil diunggah!`);
    },1500);
  }
  
  const handleRunRecon = () => {
    alert("Navigasi ke halaman Pemicu Rekonsiliasi Baru (/reconciliation/new)");
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
          type="button"
          onClick={() => setIsUploadOpen(true)}
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

        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
              {/* Header Modal */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Unggah File Rekonsiliasi</h3>
                  <p className="text-xs text-slate-500">Pilih file CSV, Excel, atau TXT data transaksi</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setSelectedFile(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm font-bold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Upload */}
              <form onSubmit={handleSubmitUpload} className="space-y-4">
                {/* Box Dropzone */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all relative">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, .txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-700">
                          Klik untuk memilih atau drag & drop file
                        </p>
                        <p className="text-[10px] text-slate-400">CSV, XLSX, atau TXT (Maks. 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadOpen(false);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                      !selectedFile || isUploading
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                    }`}
                  >
                    {isUploading ? "Mengunggah..." : "Unggah & Proses"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}