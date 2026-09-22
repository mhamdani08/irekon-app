"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { 
  GitCompare, ArrowLeft, CheckCircle2, XCircle, Clock, 
  Download, FileSpreadsheet, FileText, File, ShieldCheck, Wrench,
  Search, Database, FileCode2, Layers, Check, RefreshCw, Eye, Info
} from "lucide-react";

export default function ReconciliationRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const { hasPermission } = useAuthStore();

  const canApprove = hasPermission("recon.approval.approve");
  const canAdjust = hasPermission("recon.adjustment.create");

  const [run, setRun] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("ALL");
  const [inspectRecord, setInspectRecord] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveForm, setApproveForm] = useState({
    match_result_id: "",
    approval_status: "APPROVED",
    notes: "",
  });

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    match_result_id: "",
    adjustment_type: "FORCE_MATCH",
    reason: "",
  });

  const fetchRunDetails = async () => {
    setLoading(true);
    try {
      const runRes = await apiFetch<any>(`/api/v1/recon-execution/runs/${runId}`);
      if (runRes?.data) {
        setRun(runRes.data);
      }
    } catch (err) {
      console.error("Gagal mengambil detail run:", err);
    }

    try {
      const resultsRes = await apiFetch<any>(`/api/v1/recon-execution/runs/${runId}/results?match_status=${activeStatusFilter}&limit=5000`);
      setResults(resultsRes?.data || []);
    } catch (err) {
      console.error("Gagal mengambil hasil pencocokan:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runId) {
      fetchRunDetails();
    }
  }, [runId, activeStatusFilter]);

  useEffect(() => {
    if (run && (run.status === "RUNNING" || run.status === "PENDING")) {
      const interval = setInterval(() => {
        fetchRunDetails();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [runId, run?.status]);

  const handleExport = async (format: string) => {
    if (!run) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005"}/api/v1/recon-execution/runs/${run.id}/export?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Gagal mengunduh laporan eksekusi");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RECON_${run.run_number}.${format === "excel" ? "csv" : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenApproveModal = (resId: string) => {
    setApproveForm({ match_result_id: resId, approval_status: "APPROVED", notes: "" });
    setShowApproveModal(true);
  };

  const handleOpenAdjustModal = (resId: string) => {
    setAdjustForm({ match_result_id: resId, adjustment_type: "FORCE_MATCH", reason: "" });
    setShowAdjustModal(true);
  };

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/recon-execution/results/${approveForm.match_result_id}/approve`, {
        method: "POST",
        body: JSON.stringify(approveForm),
      });
      setShowApproveModal(false);
      fetchRunDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/recon-execution/results/${adjustForm.match_result_id}/adjust`, {
        method: "POST",
        body: JSON.stringify(adjustForm),
      });
      setShowAdjustModal(false);
      fetchRunDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getDisplayKey = (res: any) => {
    if (res?.business_key && !res.business_key.startsWith("REC-")) {
      return res.business_key;
    }
    const profileMappings = run?.profile?.field_mappings || run?.field_mappings || [];
    const keyMappings = profileMappings.filter((m: any) => m.is_key);

    const payloads = [res.core_payload, res.partner_payload].filter(Boolean);
    for (const payload of payloads) {
      for (const km of keyMappings) {
        if (payload[km.target_field] && String(payload[km.target_field]).trim() !== "" && !String(payload[km.target_field]).startsWith("REC-")) {
          return String(payload[km.target_field]).trim();
        }
        if (payload[km.source_field] && String(payload[km.source_field]).trim() !== "" && !String(payload[km.source_field]).startsWith("REC-")) {
          return String(payload[km.source_field]).trim();
        }
      }
      for (const [k, v] of Object.entries(payload)) {
        const valStr = String(v).trim();
        if (valStr && valStr.length > 5 && !valStr.startsWith("REC-") && !k.startsWith("col_") && !k.startsWith("Unnamed")) {
          return valStr;
        }
      }
    }
    return res.business_key || "-";
  };

  const getMappedPayloadEntries = (payload: any, sourceRole?: string) => {
    if (!payload || typeof payload !== "object") return [];
    const profileMappings = run?.profile?.field_mappings || run?.field_mappings || [];
    const sources = run?.profile?.sources || run?.sources || [];
    
    let activeMappings = profileMappings;
    if (sourceRole && sources.length > 0) {
      const srcObj = sources.find((s: any) => (s.source_role || s.role) === sourceRole);
      if (srcObj) {
        const srcMaps = profileMappings.filter((m: any) => m.source_id === srcObj.id);
        if (srcMaps.length > 0) {
          activeMappings = srcMaps;
        }
      }
    }

    if (activeMappings.length === 0) {
      return Object.entries(payload)
        .filter(([k]) => !k.startsWith("col_") && !k.startsWith("Unnamed:") && k.length > 1)
        .map(([k, v]) => ({ label: k, value: String(v !== null && v !== undefined ? v : "-"), targetField: k }));
    }

    const result: { label: string; value: any; targetField: string }[] = [];
    const seen = new Set<string>();

    for (const m of activeMappings) {
      const tf = m.target_field;
      const sf = m.source_field;
      let val = payload[tf] !== undefined && payload[tf] !== null ? payload[tf] : payload[sf];

      if (val === undefined || val === null || String(val).trim() === "") {
        for (const [pk, pv] of Object.entries(payload)) {
          if (pk.toLowerCase() === sf.toLowerCase() || pk.toLowerCase() === tf.toLowerCase()) {
            val = pv;
            break;
          }
        }
      }

      const displayLabel = sf ? `${tf} (${sf})` : tf;
      if (!seen.has(displayLabel)) {
        seen.add(displayLabel);
        result.push({
          label: displayLabel,
          value: val !== undefined && val !== null ? String(val) : "-",
          targetField: tf
        });
      }
    }

    return result;
  };

  const filteredResults = results.filter((res) =>
    getDisplayKey(res).toLowerCase().includes(search.toLowerCase()) ||
    res.match_status.toLowerCase().includes(search.toLowerCase()) ||
    (res.difference_summary && res.difference_summary.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading && !run) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[rgb(0,103,71)]" />
        <span>Memuat detail eksekusi rekonsiliasi...</span>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <p className="font-bold text-lg text-slate-600">Data eksekusi tidak ditemukan</p>
        <button onClick={() => router.push("/reconciliation")} className="px-5 py-2.5 bg-[rgb(0,103,71)] text-white rounded-2xl text-sm font-bold shadow-md">
          Kembali ke Riwayat Eksekusi
        </button>
      </div>
    );
  }

  const matchRate = run.total_records > 0 ? ((run.total_match / run.total_records) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          {/* Top Navigation & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/reconciliation")}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">{run.run_number}</h1>
                  <span 
                    style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
                    className="px-3 py-1 rounded-xl border font-bold text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>STATUS: {run.status}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Profil: <strong className="text-slate-800">{run.profile?.recon_name || run.profile?.recon_code || "BI-FAST"}</strong></span>
                  <span>•</span>
                  <span>Tanggal Data: <strong className="text-slate-800">{run.run_date}</strong></span>
                  <span>•</span>
                  <span>Trigger: <strong className="text-slate-800">{run.trigger_type}</strong></span>
                </div>
              </div>
            </div>

            {/* Top Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("excel")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Export CSV/Excel</span>
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-red-300 bg-red-50 text-red-800 font-bold text-xs hover:bg-red-100 transition shadow-xs"
              >
                <FileText className="w-4 h-4 text-red-700" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => handleExport("txt")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition shadow-xs"
              >
                <File className="w-4 h-4 text-slate-600" />
                <span>Export TXT</span>
              </button>
            </div>
          </div>

          {/* Match Rate Overview Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Rekonsiliasi (Match Rate)</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">{matchRate}%</span>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {run.total_match} / {run.total_records} Transaksi Cocok 100%
                  </span>
                </div>
              </div>

              {/* Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center min-w-[110px]">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Record</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{run.total_records}</span>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200 text-center min-w-[110px]">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase block">Matched</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">{run.total_match}</span>
                </div>
                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 text-center min-w-[110px]">
                  <span className="text-[11px] font-bold text-amber-600 uppercase block">Mismatch</span>
                  <span className="text-lg font-black text-amber-700 font-mono">{run.total_mismatch}</span>
                </div>
                <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200 text-center min-w-[110px]">
                  <span className="text-[11px] font-bold text-purple-600 uppercase block">Missing</span>
                  <span className="text-lg font-black text-purple-700 font-mono">{run.total_missing_core + run.total_missing_partner}</span>
                </div>
              </div>
            </div>

            {/* Visual Proportion Bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                <div style={{ width: `${(run.total_match / (run.total_records || 1)) * 100}%` }} className="bg-emerald-500 h-full transition-all" title={`Matched: ${run.total_match}`} />
                <div style={{ width: `${(run.total_mismatch / (run.total_records || 1)) * 100}%` }} className="bg-amber-500 h-full transition-all" title={`Mismatch: ${run.total_mismatch}`} />
                <div style={{ width: `${(run.total_missing_core / (run.total_records || 1)) * 100}%` }} className="bg-red-500 h-full transition-all" title={`Missing Core: ${run.total_missing_core}`} />
                <div style={{ width: `${(run.total_missing_partner / (run.total_records || 1)) * 100}%` }} className="bg-purple-500 h-full transition-all" title={`Missing Partner: ${run.total_missing_partner}`} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Matched ({run.total_match})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Mismatch ({run.total_mismatch})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Missing Core ({run.total_missing_core})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Missing Partner ({run.total_missing_partner})</span>
                </div>
                <span>Duration: {run.finished_at ? "Processed in < 1s" : "Processing"}</span>
              </div>
            </div>
          </div>

          {/* Sources Ingested Metadata Cards */}
          {((run.run_sources && run.run_sources.length > 0) || (run.sources && run.sources.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(run.run_sources || run.sources || []).map((src: any) => {
                const filesList = src.run_files || src.files || [];
                return (
                  <div key={src.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                          <Database className="w-4 h-4 text-[rgb(0,103,71)]" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{src.source?.source_name || (src.source_id ? "Sumber Data" : "Sumber Data")}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">ROLE: {src.source?.source_role || "DATA SOURCE"}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                        {src.status} ({src.total_records} Records)
                      </span>
                    </div>
                    {filesList.length > 0 && (
                      <div className="space-y-1.5">
                        {filesList.map((f: any) => (
                          <div key={f.id} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <span className="font-mono font-bold text-slate-800 truncate max-w-[240px]">{f.filename}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{(f.file_size / 1024).toFixed(1)} KB • {f.processed_lines} lines</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Status Filter Tabs & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              {/* Filter Tabs */}
              <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
                {[
                  { id: "ALL", label: `Semua Hasil (${run.total_records})` },
                  { id: "MATCHED", label: `MATCHED (${run.total_match})` },
                  { id: "MISMATCH_AMOUNT", label: `MISMATCH (${run.total_mismatch})` },
                  { id: "MISSING_CORE", label: `MISSING CORE (${run.total_missing_core})` },
                  { id: "MISSING_PARTNER", label: `MISSING PARTNER (${run.total_missing_partner})` },
                ].map((tab) => {
                  const isActive = activeStatusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStatusFilter(tab.id)}
                      style={isActive ? { borderBottomColor: "rgb(0, 103, 71)", color: "rgb(0, 103, 71)" } : {}}
                      className={`px-4 py-2 font-bold text-xs border-b-2 transition whitespace-nowrap ${
                        isActive ? "border-b-2 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Business Key / Ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Results Count & Match Results Table */}
            {(() => {
              const totalItems = filteredResults.length;
              const effectivePageSize = pageSize === 0 ? totalItems || 1 : pageSize;
              const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize);
              const curPage = Math.min(currentPage, totalPages || 1);
              const startIndex = (curPage - 1) * effectivePageSize;
              const paginatedResults = pageSize === 0 ? filteredResults : filteredResults.slice(startIndex, startIndex + effectivePageSize);

              return (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + paginatedResults.length, totalItems)}</strong> dari <strong>{totalItems}</strong> record ({run.total_records} Total Master)
                    </span>
                    <span>Filter Status: <strong className="text-slate-800">{activeStatusFilter}</strong></span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm border-collapse">
                        {(() => {
                          const profileMappedTargetFields = Array.from(
                            new Set((run?.profile?.field_mappings || []).map((fm: any) => fm.target_field))
                          ).filter(Boolean);
                          const dynamicCols = profileMappedTargetFields.slice(0, 4);

                          return (
                            <>
                              <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                                  <th className="py-3.5 px-4">No</th>
                                  <th className="py-3.5 px-4">Business Key (No Ref)</th>
                                  <th className="py-3.5 px-4">Match Status</th>
                                  <th className="py-3.5 px-4">Ringkasan Komparasi / Selisih</th>
                                  {dynamicCols.map((tf: any) => (
                                    <th key={tf} className="py-3.5 px-4">{tf}</th>
                                  ))}
                                  <th className="py-3.5 px-4 text-center">Detail Discrepancies</th>
                                  <th className="py-3.5 px-4 text-right">Aksi (RBAC)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-xs">
                                {paginatedResults.length === 0 ? (
                                  <tr><td colSpan={6 + dynamicCols.length} className="py-12 text-center text-slate-400 font-bold">Tidak ada record hasil untuk filter ini</td></tr>
                                ) : (
                                  paginatedResults.map((res, idx) => {
                                    const payload = res.core_payload || res.partner_payload || {};
                                    return (
                                      <tr key={res.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">{startIndex + idx + 1}</td>
                                        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                                          {getDisplayKey(res)}
                                        </td>
                                        <td className="py-3.5 px-4">
                                          {res.match_status === "MATCHED" && (
                                            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-200 inline-flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                              <span>MATCHED 100%</span>
                                            </span>
                                          )}
                                          {res.match_status === "MISMATCH_AMOUNT" && (
                                            <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 font-extrabold text-[11px] border border-amber-200 inline-flex items-center gap-1">
                                              <Info className="w-3 h-3 text-amber-600" />
                                              <span>MISMATCH AMOUNT</span>
                                            </span>
                                          )}
                                          {res.match_status === "MISSING_CORE" && (
                                            <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-800 font-extrabold text-[11px] border border-red-200 inline-flex items-center gap-1">
                                              <XCircle className="w-3 h-3 text-red-600" />
                                              <span>MISSING CORE</span>
                                            </span>
                                          )}
                                          {res.match_status === "MISSING_PARTNER" && (
                                            <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 font-extrabold text-[11px] border border-purple-200 inline-flex items-center gap-1">
                                              <XCircle className="w-3 h-3 text-purple-600" />
                                              <span>MISSING PARTNER</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-700 max-w-[240px]">
                                          {res.difference_summary || "Match"}
                                        </td>
                                        {dynamicCols.map((tf: any) => {
                                          const val = payload[tf] !== undefined && payload[tf] !== null ? String(payload[tf]) : "-";
                                          return (
                                            <td key={tf} className="py-3.5 px-4 font-mono text-slate-700 text-xs truncate max-w-[130px]" title={val}>
                                              {val}
                                            </td>
                                          );
                                        })}
                                        <td className="py-3.5 px-4 text-center">
                                          {res.details?.length > 0 ? (
                                            <div className="space-y-1 text-left inline-block">
                                              {res.details.map((d: any) => (
                                                <div key={d.id} className="text-[11px] bg-red-50 border border-red-200 p-2 rounded-xl text-red-900 font-mono">
                                                  <span className="font-bold uppercase text-[10px] block">{d.field_name}:</span>
                                                  Core: <strong>{d.core_value || "NULL"}</strong> vs Partner: <strong>{d.partner_value || "NULL"}</strong>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 font-mono text-xs">-</span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              onClick={() => setInspectRecord(res)}
                                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                                              title="Lihat Detail Field Mapping"
                                            >
                                              <Eye className="w-3.5 h-3.5 text-[rgb(0,103,71)]" />
                                              <span>Detail Data</span>
                                            </button>
                                            {res.match_status !== "MATCHED" && (
                                              <>
                                                {canApprove && (
                                                  <button
                                                    onClick={() => handleOpenApproveModal(res.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition"
                                                  >
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    <span>Approve</span>
                                                  </button>
                                                )}
                                                {canAdjust && (
                                                  <button
                                                    onClick={() => handleOpenAdjustModal(res.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition"
                                                  >
                                                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>Force Match</span>
                                                  </button>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </>
                          );
                        })()}
                      </table>
                    </div>

                  {/* Interactive Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-3">
                      <span>Ukuran Halaman:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-bold focus:outline-none focus:border-emerald-600"
                      >
                        <option value={25}>25 data / hal</option>
                        <option value={50}>50 data / hal</option>
                        <option value={100}>100 data / hal</option>
                        <option value={250}>250 data / hal</option>
                        <option value={500}>500 data / hal</option>
                        <option value={0}>Semua Data (Unfiltered)</option>
                      </select>
                    </div>

                    {pageSize > 0 && totalPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={curPage === 1}
                          onClick={() => setCurrentPage(1)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-700 font-bold transition"
                        >
                          « First
                        </button>
                        <button
                          disabled={curPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-700 font-bold transition"
                        >
                          ‹ Prev
                        </button>
                        <span className="px-3 py-1 font-mono font-extrabold text-slate-900 bg-emerald-50 border border-emerald-200 rounded-xl">
                          Halaman {curPage} dari {totalPages}
                        </span>
                        <button
                          disabled={curPage === totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-700 font-bold transition"
                        >
                          Next ›
                        </button>
                        <button
                          disabled={curPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-700 font-bold transition"
                        >
                          Last »
                        </button>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </main>
      </div>

      {/* Modal Inspect Field Mapping Payload */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[rgb(0,103,71)]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Detail Field Mapping Payload — <span className="font-mono text-emerald-700">{getDisplayKey(inspectRecord)}</span>
                </h3>
              </div>
              <button onClick={() => setInspectRecord(null)} className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-400 font-bold text-sm">✕</button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {inspectRecord.difference_summary && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">RINGKASAN STATUS:</span>
                  <span className="font-semibold text-slate-800">{inspectRecord.difference_summary}</span>
                </div>
              )}

              {/* Core Payload Table */}
              {inspectRecord.core_payload && Object.keys(inspectRecord.core_payload).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>CORE DATA SOURCE PAYLOAD</span>
                  </h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {getMappedPayloadEntries(inspectRecord.core_payload, "CORE").map((item, i) => (
                        <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">{item.label}:</span>
                          <span className="font-bold text-slate-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Partner Payload Table */}
              {inspectRecord.partner_payload && Object.keys(inspectRecord.partner_payload).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-purple-600" />
                    <span>PARTNER DATA SOURCE PAYLOAD</span>
                  </h4>
                  <div className="bg-purple-50/40 rounded-2xl border border-purple-100 p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {getMappedPayloadEntries(inspectRecord.partner_payload, "PARTNER").map((item, i) => (
                        <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">{item.label}:</span>
                          <span className="font-bold text-slate-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback if no payloads were returned directly */}
              {(!inspectRecord.core_payload || Object.keys(inspectRecord.core_payload).length === 0) &&
               (!inspectRecord.partner_payload || Object.keys(inspectRecord.partner_payload).length === 0) && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">DATA TRANSAKSI:</span>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Business Key / No Ref:</span>
                      <span className="font-bold text-slate-900">{inspectRecord.business_key}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Match Status:</span>
                      <span className="font-bold text-slate-900">{inspectRecord.match_status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setInspectRecord(null)} className="px-5 py-2 bg-[rgb(0,103,71)] text-white rounded-2xl font-bold text-xs shadow-md">
                Tutup Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Approve Mismatch */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-extrabold text-slate-900">Approve / Reject Mismatch (RBAC)</h3>
            </div>
            <form onSubmit={handleSubmitApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Keputusan Persetujuan</label>
                <select
                  value={approveForm.approval_status}
                  onChange={(e) => setApproveForm({ ...approveForm, approval_status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-bold text-slate-900"
                >
                  <option value="APPROVED">SETUJU (APPROVED)</option>
                  <option value="REJECTED">TOLAK (REJECTED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Catatan Persetujuan (Notes)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Alasan persetujuan atau instruksi selisih..."
                  value={approveForm.notes}
                  onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2 rounded-2xl text-slate-500 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm">
                  Simpan Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Force Match / Manual Adjustment */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-extrabold text-slate-900">Manual Force Match (RBAC)</h3>
            </div>
            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tipe Penyesuaian</label>
                <select
                  value={adjustForm.adjustment_type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-bold text-slate-900"
                >
                  <option value="FORCE_MATCH">FORCE MATCH 100%</option>
                  <option value="FORCE_SETTLE">FORCE SETTLE</option>
                  <option value="OVERRIDE_AMOUNT">OVERRIDE NOMINAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Alasan Penyesuaian (Mandatory)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan alasan penyesuaian manual/force match ini..."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="px-4 py-2 rounded-2xl text-slate-500 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm">
                  Eksekusi Force Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

