"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { 
  FileText, ShieldAlert, Activity, RefreshCw, Filter, 
  Search, Eye, AlertCircle, Clock, CheckCircle2, ChevronRight
} from "lucide-react";

export default function ReportsAndAuditPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "error">("audit");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [selectedJsonData, setSelectedJsonData] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "audit") {
        const res = await apiFetch<any>(`/api/v1/audit/logs?module_name=${moduleFilter}`);
        setAuditLogs(res.data || []);
      } else {
        const res = await apiFetch<any>(`/api/v1/audit/errors?module_name=${moduleFilter}`);
        setErrorLogs(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, moduleFilter]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <FileText className="w-7 h-7 text-[rgb(0,103,71)]" />
                <span>Reports & Audit Trail Dashboard</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Pusat pengawasan jejak audit aktivitas pengguna (Audit Logs) dan penanganan kesalahan sistem (Centralized Error Logs)
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm shadow-xs hover:bg-slate-100 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Module Filter & Main Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("audit")}
                style={activeTab === "audit" ? { borderBottomColor: "rgb(0, 103, 71)", color: "rgb(0, 103, 71)" } : {}}
                className={`px-5 py-3 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${
                  activeTab === "audit" ? "border-b-2" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>System Audit Logs</span>
              </button>
              <button
                onClick={() => setActiveTab("error")}
                style={activeTab === "error" ? { borderBottomColor: "rgb(0, 103, 71)", color: "rgb(0, 103, 71)" } : {}}
                className={`px-5 py-3 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${
                  activeTab === "error" ? "border-b-2" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Centralized Error Logs</span>
              </button>
            </div>

            {/* Filter Module Dropdown */}
            <div className="flex items-center gap-2 pb-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                <option value="ALL">Semua Modul</option>
                <option value="RECON_EXECUTION">RECON_EXECUTION</option>
                <option value="RECON_APPROVAL">RECON_APPROVAL</option>
                <option value="RECON_MANUAL_ADJUSTMENT">RECON_MANUAL_ADJUSTMENT</option>
                <option value="RECON_CONFIG">RECON_CONFIG</option>
              </select>
            </div>
          </div>

          {/* TAB 1: System Audit Logs Table */}
          {activeTab === "audit" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4">Waktu (Timestamp)</th>
                      <th className="py-3 px-4">Modul & Entity</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4 text-center">User ID (Action By)</th>
                      <th className="py-3 px-4 text-right">Data Payload (JSON)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {loading ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400">Memuat audit log...</td></tr>
                    ) : auditLogs.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400">Belum ada jejak audit log tercatat</td></tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 font-mono text-xs text-slate-600">
                            <div>{new Date(log.action_at).toLocaleString("id-ID")}</div>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[150px]">{log.id}</span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-xs text-slate-900">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-mono text-[11px] block w-fit mb-0.5">
                              {log.module_name}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">{log.entity_name} ({log.entity_id || "-"})</span>
                          </td>
                          <td className="py-4 px-4">
                            {log.action_type === "EXECUTE" && (
                              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
                                EXECUTE
                              </span>
                            )}
                            {log.action_type === "APPROVE" && (
                              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                                APPROVE
                              </span>
                            )}
                            {log.action_type === "ADJUST" && (
                              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                                ADJUST
                              </span>
                            )}
                            {!["EXECUTE", "APPROVE", "ADJUST"].includes(log.action_type) && (
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                                {log.action_type}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-xs text-slate-700">
                            User #{log.action_by || 1}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedJsonData({ title: "Audit Log Payload", data: { old: log.old_data, new: log.new_data } })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat JSON</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Centralized Error Logs Table */}
          {activeTab === "error" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4">Waktu (Timestamp)</th>
                      <th className="py-3 px-4">Modul & Run ID</th>
                      <th className="py-3 px-4">Pesan Error</th>
                      <th className="py-3 px-4 text-right">Stack Trace & Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {loading ? (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">Memuat error log terpusat...</td></tr>
                    ) : errorLogs.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">Tidak ada log kesalahan tercatat (Sistem Sehat)</td></tr>
                    ) : (
                      errorLogs.map((errLog) => (
                        <tr key={errLog.id} className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 font-mono text-xs text-slate-600">
                            <div>{new Date(errLog.created_at).toLocaleString("id-ID")}</div>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[150px]">{errLog.id}</span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-xs text-slate-900">
                            <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-700 font-mono text-[11px] block w-fit mb-0.5 border border-red-200">
                              {errLog.module_name}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">Run: {errLog.recon_run_id || "N/A"}</span>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-red-600 max-w-xs truncate">
                            {errLog.error_message}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedJsonData({ title: "Error Stack Trace & Payload", data: { message: errLog.error_message, stack_trace: errLog.stack_trace, payload: errLog.payload } })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail Trace</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* JSON Modal Viewer */}
      {selectedJsonData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">{selectedJsonData.title}</h3>
            <div className="bg-slate-900 text-emerald-400 font-mono p-4 rounded-2xl text-xs overflow-x-auto max-h-96">
              <pre>{JSON.stringify(selectedJsonData.data, null, 2)}</pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedJsonData(null)}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
