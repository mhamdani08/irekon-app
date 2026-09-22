"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import {
  Sliders, Plus, Search, Check, X, FileCode2, Clock, Settings2, Trash2, Power,
  LayoutList, LayoutGrid, Layers, ShieldCheck, ChevronRight, Filter, RefreshCw
} from "lucide-react";

export default function ReconConfigPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    recon_code: "",
    recon_name: "",
    description: "",
    timezone: "Asia/Jakarta",
    retention_days: 30,
    auto_approve: false,
  });

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/v1/recon-config/profiles");
      setProfiles(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/v1/recon-config/profiles", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({
        recon_code: "",
        recon_name: "",
        description: "",
        timezone: "Asia/Jakarta",
        retention_days: 30,
        auto_approve: false,
      });
      fetchProfiles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiFetch(`/api/v1/recon-config/profiles/${id}/status`, {
        method: "PATCH",
      });
      fetchProfiles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus profil rekonsiliasi "${name}"? Seluruh data sumber, field mapping, dan compare rules terkait akan dihapus.`)) {
      return;
    }
    try {
      await apiFetch(`/api/v1/recon-config/profiles/${id}`, {
        method: "DELETE",
      });
      fetchProfiles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.recon_code.toLowerCase().includes(search.toLowerCase()) ||
      p.recon_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? p.is_active
        : !p.is_active;

    return matchesSearch && matchesStatus;
  });

  const totalActive = profiles.filter((p) => p.is_active).length;
  const totalInactive = profiles.filter((p) => !p.is_active).length;
  const totalSources = profiles.reduce((acc, curr) => acc + (curr.sources?.length || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
                <Sliders className="w-4 h-4 text-[rgb(0,103,71)]" />
                <span>Configuration Center</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Profil Rekonsiliasi</h1>
              <p className="text-xs text-slate-500 mt-0.5">Kelola aturan bisnis, data sources, field mapping, parser, dan komparator rekonsiliasi</p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              style={{ backgroundColor: "rgb(0, 103, 71)" }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-white font-bold text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Profil Rekon</span>
            </button>
          </div>

          {/* SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold uppercase text-slate-400">Total Profil</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{profiles.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Aturan Rekonsiliasi Terdaftar</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold uppercase text-emerald-600">Aktif Running</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{totalActive}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Siap Dieksekusi / Scheduled</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold uppercase text-slate-400">Non-Aktif</div>
              <div className="text-2xl font-extrabold text-slate-500 mt-1">{totalInactive}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Status Standby / Paused</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold uppercase font-mono text-[rgb(0,103,71)]">Total Sources</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalSources}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Database, FTP, File Connected</div>
            </div>
          </div>

          {/* FILTER & VIEW SWITCHER BAR */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan kode, nama, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[rgb(0,103,71)] focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-700 font-bold focus:outline-none text-xs"
                >
                  <option value="ALL">Semua Status ({profiles.length})</option>
                  <option value="ACTIVE">Aktif ({totalActive})</option>
                  <option value="INACTIVE">Non-Aktif ({totalInactive})</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchProfiles}
                title="Refresh Data"
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === "list"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid View</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium text-xs">
              Memuat data profil rekonsiliasi...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium text-xs">
              Tidak ada profil rekonsiliasi yang ditemukan
            </div>
          ) : viewMode === "list" ? (

            /* LIST / TABLE VIEW (CORPORATE STYLE) */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4 font-mono">Kode Rekon</th>
                      <th className="py-3.5 px-4">Nama Profil & Deskripsi</th>
                      <th className="py-3.5 px-4">Data Sources</th>
                      <th className="py-3.5 px-4">Retention</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredProfiles.map((p) => {
                      const sourcesCount = p.sources?.length || 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* Kode Rekon */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", color: "rgb(0, 103, 71)" }}
                              className="px-2.5 py-1 rounded-lg border border-[rgba(0,103,71,0.2)] font-mono text-xs font-bold inline-block"
                            >
                              {p.recon_code}
                            </span>
                          </td>

                          {/* Nama Profil & Deskripsi */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs">{p.recon_name}</div>
                            <div className="text-[11px] text-slate-400 max-w-md truncate mt-0.5">
                              {p.description || "Tidak ada deskripsi"}
                            </div>
                          </td>

                          {/* Data Sources */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                                {sourcesCount} Source{sourcesCount > 1 ? "s" : ""}
                              </span>
                              {p.sources && p.sources.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {p.sources.slice(0, 2).map((s: any) => (
                                    <span key={s.id} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                                      {s.source_type}
                                    </span>
                                  ))}
                                  {p.sources.length > 2 && (
                                    <span className="text-[10px] text-slate-400 font-semibold">+{p.sources.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Retention */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.retention_days} Hari</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(p.id)}
                              title={p.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition inline-flex items-center gap-1.5 ${
                                p.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                              <span>{p.is_active ? "ACTIVE" : "INACTIVE"}</span>
                            </button>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/recon-config/${p.id}`}
                                style={{ color: "rgb(0, 103, 71)", borderColor: "rgba(0, 103, 71, 0.3)" }}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-xs font-bold transition border shadow-2xs flex items-center gap-1"
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                                <span>Kelola Config</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                onClick={() => handleDeleteProfile(p.id, p.recon_name)}
                                title="Hapus Profil Rekon"
                                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (

            /* GRID VIEW (CLEAN & ELEGANT COMPACT CARDS) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProfiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-[rgb(0,103,71)]/40 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", color: "rgb(0, 103, 71)" }}
                        className="px-2.5 py-0.5 rounded-lg border border-[rgba(0,103,71,0.2)] font-mono text-xs font-bold"
                      >
                        {p.recon_code}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {p.is_active ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{p.recon_name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description || "Tidak ada deskripsi"}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.sources?.length || 0} Sources</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.retention_days} Days Ret</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteProfile(p.id, p.recon_name)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/recon-config/${p.id}`}
                      style={{ color: "rgb(0, 103, 71)" }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-xs font-bold transition border border-slate-200"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Kelola Config</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* MODAL CREATE PROFILE */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Tambah Profil Rekonsiliasi Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kode Rekonsiliasi (Unique Code)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PLN_SETTLEMENT"
                  value={formData.recon_code}
                  onChange={(e) => setFormData({ ...formData, recon_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[rgb(0,103,71)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Rekonsiliasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PLN Settlement Reconciliation"
                  value={formData.recon_name}
                  onChange={(e) => setFormData({ ...formData, recon_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat profil rekonsiliasi..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Timezone</label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Retention (Hari)</label>
                  <input
                    type="number"
                    value={formData.retention_days}
                    onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) || 30 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "rgb(0, 103, 71)" }}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm hover:brightness-110 transition"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
