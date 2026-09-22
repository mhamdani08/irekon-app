"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { 
  GitCompare, Play, Search, CheckCircle2, XCircle, Clock, 
  ArrowRight, RefreshCw
} from "lucide-react";

export default function ReconciliationRunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTriggerModal, setShowTriggerModal] = useState(false);

  const [triggerForm, setTriggerForm] = useState({
    recon_profile_id: "",
    run_date: "2026-06-11",
    trigger_type: "MANUAL",
    remarks: "",
  });

  const fetchProfiles = async () => {
    try {
      const profilesRes = await apiFetch<any>("/api/v1/recon-config/profiles");
      const pList = profilesRes.data || [];
      setProfiles(pList);
      if (pList.length > 0) {
        setTriggerForm((prev) => (prev.recon_profile_id ? prev : { ...prev, recon_profile_id: pList[0].id }));
      }
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  const fetchRuns = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const runsRes = await apiFetch<any>(`/api/v1/recon-execution/runs?_t=${Date.now()}`);
      setRuns(runsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchRuns(true);
    const interval = setInterval(() => {
      fetchRuns(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const handleTriggerRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerForm.recon_profile_id) {
      alert("Silakan pilih Profil Rekonsiliasi terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/recon-execution/runs/trigger", {
        method: "POST",
        body: JSON.stringify(triggerForm),
      });
      setShowTriggerModal(false);
      fetchRuns();
    } catch (err: any) {
      alert(err.message || "Gagal memicu rekonsiliasi. Mengabaikan timeout transient.");
      setShowTriggerModal(false);
      fetchRuns();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRuns = runs.filter((r) =>
    r.run_number.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          {/* Top Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <GitCompare className="w-7 h-7 text-[rgb(0,103,71)]" />
                <span>Reconciliation Execution Engine</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitoring eksekusi pipeline rekonsiliasi data mentah ke hasil pencocokan (Tracking)
              </p>
            </div>
            <button
              onClick={() => setShowTriggerModal(true)}
              style={{ backgroundColor: "rgb(0, 103, 71)" }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:opacity-95 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Jalankan Rekonsiliasi Baru</span>
            </button>
          </div>

          {/* Search & Statistics Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan Nomor Run / Status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[rgb(0,103,71)]"
              />
            </div>
            <button 
              onClick={fetchRuns}
              className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition"
              title="Refresh Riwayat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Execution History Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Run Number</th>
                    <th className="py-3 px-4">Tanggal & Trigger</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Total Data</th>
                    <th className="py-3 px-4 text-center">Matched</th>
                    <th className="py-3 px-4 text-center">Selisih</th>
                    <th className="py-3 px-4 text-center">Missing Core/Partner</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {loading ? (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400">Memuat riwayat eksekusi...</td></tr>
                  ) : filteredRuns.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400">Belum ada eksekusi rekonsiliasi</td></tr>
                  ) : (
                    filteredRuns.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          <div>{r.run_number}</div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">{r.id}</span>
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold">
                          <div>{r.run_date}</div>
                          <span className="text-[11px] text-slate-500 uppercase">{r.trigger_type}</span>
                        </td>
                        <td className="py-4 px-4">
                          {(r.status === "SUCCESS" || r.status === "COMPLETED") && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              COMPLETED
                            </span>
                          )}
                          {(r.status === "RUNNING" || r.status === "IN_PROGRESS" || r.status === "PENDING") && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200 animate-pulse">
                              <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              IN PROGRESS
                            </span>
                          )}
                          {r.status === "FAILED" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200">
                              <XCircle className="w-3.5 h-3.5" />
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-extrabold">{r.total_records}</td>
                        <td className="py-4 px-4 text-center font-mono font-extrabold text-emerald-600">{r.total_match}</td>
                        <td className="py-4 px-4 text-center font-mono font-extrabold text-amber-600">{r.total_mismatch}</td>
                        <td className="py-4 px-4 text-center font-mono text-xs">
                          <span className="text-red-600 font-bold">{r.total_missing_core}</span> / <span className="text-purple-600 font-bold">{r.total_missing_partner}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/reconciliation/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition"
                          >
                            <span>Detail Matrix</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Trigger Recon Execution */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Jalankan Eksekusi Rekonsiliasi Baru</h3>
            <form onSubmit={handleTriggerRun} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pilih Profil Rekonsiliasi</label>
                <select
                  value={triggerForm.recon_profile_id}
                  onChange={(e) => setTriggerForm({ ...triggerForm, recon_profile_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-bold text-slate-900"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.recon_name} ({p.recon_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tanggal Data (Run Date)</label>
                  <input
                    type="date"
                    required
                    value={triggerForm.run_date}
                    onChange={(e) => setTriggerForm({ ...triggerForm, run_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Trigger Type</label>
                  <select
                    value={triggerForm.trigger_type}
                    onChange={(e) => setTriggerForm({ ...triggerForm, trigger_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-semibold"
                  >
                    <option value="MANUAL">MANUAL</option>
                    <option value="SCHEDULER">SCHEDULER</option>
                    <option value="RERUN">RERUN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Catatan (Remarks)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan opsional untuk eksekusi ini..."
                  value={triggerForm.remarks}
                  onChange={(e) => setTriggerForm({ ...triggerForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTriggerModal(false)} className="px-4 py-2 rounded-2xl text-slate-500 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" style={{ backgroundColor: "rgb(0, 103, 71)" }} className="px-4 py-2 rounded-2xl text-white font-bold text-sm">
                  Mulai Eksekusi Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
