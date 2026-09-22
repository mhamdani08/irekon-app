"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { 
  Sliders, ArrowLeft, Database, FileCode2, 
  GitBranch, Clock, Plus, Check, Server, Trash2, Pencil, FileSpreadsheet, Filter, CheckCircle2, AlertCircle
} from "lucide-react";

export default function ReconConfigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id;

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "sources" | "mapping" | "rules" | "schedule">("general");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | "ALL">("ALL");

  // Sub-forms state
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceForm, setSourceForm] = useState({
    source_role: "CORE",
    source_name: "",
    source_type: "FILE",
    priority_order: 1,
    // Connection Details
    host: "",
    port: "" as number | string,
    username: "",
    password_encrypted: "",
    database_name: "CORE_DB2",
    schema_name: "COREDB",
    db_driver: "IBM_DB2",
    sql_query: "SELECT TRX_REF_NO, TRX_AMOUNT, TRX_TIMESTAMP, STATUS_CODE FROM COREDB.TXN_HISTORY WHERE TRX_DATE = DATE('{YYYY-MM-DD}')",
    api_url: "",
    api_method: "POST",
    private_key_path: "",
    timeout_seconds: 30,
    // File Parser Config Details
    file_pattern: "PLN_BILLER_{YYYYMMDD}.txt",
    file_type: "CSV",
    delimiter: ",",
    enclosure_char: '"',
    escape_char: "\\",
    has_header: true,
    encoding: "UTF-8",
    date_format: "YYYY-MM-DD HH:mm:ss",
    decimal_separator: ".",
    thousand_separator: ",",
    start_cell: "A1",
    sheet_name: "Sheet1",
    header_row: 1,
    data_start_row: 2,
    archive_path: "/var/archive/recon/",
  });

  const resolvePreviewPattern = (pattern: string) => {
    if (!pattern) return "";
    const d = new Date();
    const yyyy = d.getFullYear().toString();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = yyyy.slice(-2);
    
    const prevDate = new Date(d);
    prevDate.setDate(d.getDate() - 1);
    const prevYyyy = prevDate.getFullYear().toString();
    const prevMm = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevDd = String(prevDate.getDate()).padStart(2, '0');

    return pattern
      .replace(/{YYYYMMDD}/g, `${yyyy}${mm}${dd}`)
      .replace(/{YYYY-MM-DD}/g, `${yyyy}-${mm}-${dd}`)
      .replace(/{DDMMYYYY}/g, `${dd}${mm}${yyyy}`)
      .replace(/{DD-MM-YYYY}/g, `${dd}-${mm}-${yyyy}`)
      .replace(/{YYYYMM}/g, `${yyyy}${mm}`)
      .replace(/{YYMMDD}/g, `${yy}${mm}${dd}`)
      .replace(/{YYYYMMDD-1}/g, `${prevYyyy}${prevMm}${prevDd}`)
      .replace(/{YYYY-MM-DD-1}/g, `${prevYyyy}-${prevMm}-${prevDd}`);
  };

  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    try {
      const payload = {
        source_type: sourceForm.source_type,
        host: sourceForm.host,
        port: sourceForm.port ? Number(sourceForm.port) : 0,
        username: sourceForm.username,
        database_name: sourceForm.database_name,
        schema_name: sourceForm.schema_name,
        api_url: sourceForm.api_url,
        api_method: sourceForm.api_method,
        extra_config: {
          db_driver: sourceForm.db_driver,
          sql_query: sourceForm.sql_query,
          archive_path: sourceForm.archive_path,
        },
      };
      const res = await apiFetch<any>("/api/v1/recon-config/sources/test-connection", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.data) {
        setTestResult(res.data);
      } else {
        setTestResult({ success: false, message: res.message || "Gagal melakukan tes koneksi" });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Gagal menghubungi server backend iRekon",
      });
    } finally {
      setTestingConn(false);
    }
  };

  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [mappingForm, setMappingForm] = useState({
    source_id: "",
    source_field: "",
    target_field: "",
    data_type: "STRING",
    field_order: 1,
    is_key: false,
    is_compare: true,
    is_required: false,
    default_value: "",
  });

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    field_name: "",
    rule_type: "EXACT",
    tolerance_value: 0,
    ignore_case: false,
    ignore_trim: true,
    null_equals_empty: true,
  });

  const fetchProfileDetail = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/api/v1/recon-config/profiles/${profileId}`);
      setProfile(res.data);
      if (res.data?.sources?.length > 0) {
        setMappingForm((prev: any) => ({ ...prev, source_id: res.data.sources[0].id }));
      }
      if (res.data?.field_mappings?.length > 0) {
        setRuleForm((prev: any) => ({ ...prev, field_name: res.data.field_mappings[0].target_field }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfileDetail();
    }
  }, [profileId]);

  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  const handleEditSource = (s: any) => {
    const conn = s.connections?.[0] || {};
    const parser = s.file_configs?.[0] || {};
    const extra = conn.extra_config || {};

    setEditingSourceId(s.id);
    setTestResult(null);
    setSourceForm({
      source_role: s.source_role || "CORE",
      source_name: s.source_name || "",
      source_type: s.source_type || "FILE",
      priority_order: s.priority_order || 1,
      host: conn.host || "",
      port: conn.port || "",
      username: conn.username || "",
      password_encrypted: conn.password_encrypted || "",
      database_name: conn.database_name || "CORE_DB2",
      schema_name: conn.schema_name || "COREDB",
      db_driver: extra.db_driver || "IBM_DB2",
      sql_query: extra.sql_query || "SELECT TRX_REF_NO, TRX_AMOUNT, TRX_TIMESTAMP, STATUS_CODE FROM COREDB.TXN_HISTORY WHERE TRX_DATE = DATE('{YYYY-MM-DD}')",
      api_url: conn.api_url || "",
      api_method: conn.api_method || "POST",
      private_key_path: conn.private_key_path || "",
      timeout_seconds: conn.timeout_seconds || 30,
      file_pattern: parser.file_pattern || "PLN_BILLER_{YYYYMMDD}.txt",
      file_type: parser.file_type || "CSV",
      delimiter: parser.delimiter || ",",
      enclosure_char: parser.enclosure_char || '"',
      escape_char: parser.escape_char || "\\",
      has_header: parser.has_header !== undefined ? parser.has_header : true,
      encoding: parser.encoding || "UTF-8",
      date_format: parser.date_format || "YYYY-MM-DD HH:mm:ss",
      decimal_separator: parser.decimal_separator || ".",
      thousand_separator: parser.thousand_separator || ",",
      start_cell: parser.start_cell || "A1",
      sheet_name: parser.sheet_name || "Sheet1",
      header_row: parser.header_row || 1,
      data_start_row: parser.data_start_row || 2,
      archive_path: parser.archive_path || "/var/archive/recon/",
    });
    setShowSourceModal(true);
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        source_role: sourceForm.source_role,
        source_name: sourceForm.source_name,
        source_type: sourceForm.source_type,
        priority_order: Number(sourceForm.priority_order),
        connection: {
          host: sourceForm.host || null,
          port: sourceForm.port ? Number(sourceForm.port) : null,
          username: sourceForm.username || null,
          password_encrypted: sourceForm.password_encrypted || null,
          database_name: sourceForm.database_name || null,
          schema_name: sourceForm.schema_name || null,
          api_url: sourceForm.api_url || null,
          api_method: sourceForm.api_method || null,
          private_key_path: sourceForm.private_key_path || null,
          timeout_seconds: Number(sourceForm.timeout_seconds) || 30,
          extra_config: {
            db_driver: sourceForm.db_driver,
            sql_query: sourceForm.sql_query,
            archive_path: sourceForm.archive_path,
          },
        },
      };

      if (sourceForm.source_type !== "DATABASE") {
        payload.file_config = {
          file_pattern: sourceForm.file_pattern,
          file_type: sourceForm.file_type,
          delimiter: sourceForm.delimiter,
          enclosure_char: sourceForm.enclosure_char,
          escape_char: sourceForm.escape_char,
          has_header: sourceForm.has_header,
          encoding: sourceForm.encoding,
          date_format: sourceForm.date_format,
          decimal_separator: sourceForm.decimal_separator,
          thousand_separator: sourceForm.thousand_separator,
          start_cell: sourceForm.start_cell || "A1",
          sheet_name: sourceForm.sheet_name || "Sheet1",
          header_row: Number(sourceForm.header_row) || 1,
          data_start_row: Number(sourceForm.data_start_row) || 2,
          archive_path: sourceForm.archive_path || null,
        };
      }

      if (editingSourceId) {
        await apiFetch(`/api/v1/recon-config/sources/${editingSourceId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/v1/recon-config/profiles/${profileId}/sources`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowSourceModal(false);
      setEditingSourceId(null);
      fetchProfileDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    if (!confirm(`Hapus sumber data "${sourceName}"?`)) return;
    try {
      await apiFetch(`/api/v1/recon-config/sources/${sourceId}`, { method: "DELETE" });
      fetchProfileDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mappingForm.source_id) {
      alert("Silakan pilih Data Source terlebih dahulu!");
      return;
    }
    try {
      if (editingMappingId) {
        await apiFetch(`/api/v1/recon-config/field-mappings/${editingMappingId}`, {
          method: "PUT",
          body: JSON.stringify(mappingForm),
        });
      } else {
        await apiFetch(`/api/v1/recon-config/profiles/${profileId}/field-mappings`, {
          method: "POST",
          body: JSON.stringify(mappingForm),
        });
      }
      setShowMappingModal(false);
      setEditingMappingId(null);
      setMappingForm({
        source_id: profile?.sources?.[0]?.id || "",
        source_field: "",
        target_field: "",
        data_type: "STRING",
        field_order: (profile?.field_mappings?.length || 0) + 1,
        is_key: false,
        is_compare: true,
        is_required: false,
        default_value: "",
      });
      fetchProfileDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditMapping = (fm: any) => {
    setEditingMappingId(fm.id);
    setMappingForm({
      source_id: fm.source_id,
      source_field: fm.source_field,
      target_field: fm.target_field,
      data_type: fm.data_type || "STRING",
      field_order: fm.field_order || 1,
      is_key: fm.is_key || false,
      is_compare: fm.is_compare !== undefined ? fm.is_compare : true,
      is_required: fm.is_required || false,
      default_value: fm.default_value || "",
    });
    setShowMappingModal(true);
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm("Hapus field mapping ini?")) return;
    try {
      await apiFetch(`/api/v1/recon-config/field-mappings/${mappingId}`, { method: "DELETE" });
      fetchProfileDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.field_name) {
      alert("Silakan pilih atau isi Target Field Name!");
      return;
    }
    try {
      await apiFetch(`/api/v1/recon-config/profiles/${profileId}/compare-rules`, {
        method: "POST",
        body: JSON.stringify(ruleForm),
      });
      setShowRuleModal(false);
      fetchProfileDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Hapus compare rule ini?")) return;
    try {
      await apiFetch(`/api/v1/recon-config/compare-rules/${ruleId}`, { method: "DELETE" });
      fetchProfileDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredMappings = (profile?.field_mappings || [])
    .filter((fm: any) => selectedSourceFilter === "ALL" || fm.source_id === selectedSourceFilter)
    .sort((a: any, b: any) => (a.field_order || 0) - (b.field_order || 0));

  const availableTargetFields = Array.from(new Set(profile?.field_mappings?.map((fm: any) => fm.target_field) || [])) as string[];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">
        Memuat konfigurasi profil rekonsiliasi...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <p>Profil tidak ditemukan</p>
        <button onClick={() => router.push("/recon-config")} className="px-4 py-2 bg-slate-200 rounded-xl text-sm font-semibold">
          Kembali ke Daftar Profil
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/recon-config")}
                className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{profile.recon_name}</h1>
                  <span 
                    style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
                    className="px-3 py-0.5 rounded-lg border font-mono text-xs font-bold"
                  >
                    {profile.recon_code}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{profile.description || "Konfigurasi komprehensif profil rekonsiliasi"}</p>
              </div>
            </div>
          </div>

          {/* Multi-Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
            {[
              { id: "general", label: "General Settings", icon: Sliders },
              { id: "sources", label: "Data Sources & Connection", icon: Database },
              { id: "mapping", label: "Field Mappings", icon: FileCode2 },
              { id: "rules", label: "Compare Rules Engine", icon: GitBranch },
              { id: "schedule", label: "Scheduler", icon: Clock },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={isActive ? { borderBottomColor: "rgb(0, 103, 71)", color: "rgb(0, 103, 71)" } : {}}
                  className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition ${
                    isActive ? "border-b-2 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Informasi Umum Profil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kode Rekonsiliasi</label>
                  <input
                    type="text"
                    disabled
                    value={profile.recon_code}
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-2.5 text-sm font-mono font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Rekonsiliasi</label>
                  <input
                    type="text"
                    defaultValue={profile.recon_name}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi</label>
                  <textarea
                    rows={3}
                    defaultValue={profile.description || ""}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Timezone</label>
                  <input
                    type="text"
                    defaultValue={profile.timezone}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Retention (Days)</label>
                  <input
                    type="number"
                    defaultValue={profile.retention_days}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA SOURCES & CONNECTIONS */}
          {activeTab === "sources" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sumber Data & Detail Koneksi (Sources & Connections)</h3>
                  <p className="text-xs text-slate-500">Daftar sumber data (CORE / PARTNER) dan konfigurasi koneksi FTP/SFTP/API/Database/File Parser</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSourceId(null);
                    setTestResult(null);
                    setShowSourceModal(true);
                  }}
                  style={{ backgroundColor: "rgb(0, 103, 71)" }}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-bold text-xs shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Source & Connection</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4 font-mono">Role & Type</th>
                      <th className="py-3.5 px-4">Nama Data Source</th>
                      <th className="py-3.5 px-4">Koneksi / Host</th>
                      <th className="py-3.5 px-4">File Parser Config</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {profile.sources?.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada sumber data dikonfigurasikan</td></tr>
                    ) : (
                      profile.sources?.map((s: any) => {
                        const conn = s.connections?.[0];
                        const parser = s.file_configs?.[0];
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Role & Type */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", color: "rgb(0, 103, 71)" }}
                                  className="px-2 py-0.5 rounded-md border border-[rgba(0,103,71,0.2)] font-mono text-[11px] font-bold"
                                >
                                  {s.source_role}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  {s.source_type}
                                </span>
                              </div>
                            </td>

                            {/* Nama Source */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{s.source_name}</div>
                            </td>

                            {/* Connection Details */}
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {conn ? (
                                <div className="space-y-0.5 text-slate-700">
                                  {conn.host && <div><span className="text-slate-400">Host:</span> {conn.host}:{conn.port || "-"}</div>}
                                  {conn.database_name && <div><span className="text-slate-400">DB:</span> {conn.database_name}</div>}
                                  {conn.api_url && <div className="truncate max-w-xs"><span className="text-slate-400">API:</span> {conn.api_url}</div>}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Default</span>
                              )}
                            </td>

                            {/* File Parser Details */}
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {s.source_type !== "DATABASE" && parser ? (
                                <div className="space-y-0.5 text-slate-700">
                                  <div><span className="text-slate-400">Pattern:</span> {parser.file_pattern} ({parser.file_type})</div>
                                  {parser.file_type === "EXCEL" && (
                                    <div className="text-[10px] text-emerald-700 font-bold">
                                      Cell: {parser.start_cell || "A1"} | Sheet: {parser.sheet_name || "Sheet1"}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>

                            {/* Priority */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                              #{s.priority_order}
                            </td>

                            {/* Aksi */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditSource(s)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                                  title="Edit Source & Connection"
                                >
                                  <Pencil className="w-4 h-4 text-slate-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSource(s.id, s.source_name)}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                                  title="Hapus Source"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FIELD MAPPING MATRIX */}
          {activeTab === "mapping" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Field Mapping Matrix (Multi-Source Mapping)</h3>
                  <p className="text-xs text-slate-500">Pemetaan kolom dari setiap sumber data (`source_field` → `target_field`) ke standar rekonsiliasi</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Source Filter Dropdown */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedSourceFilter}
                      onChange={(e) => setSelectedSourceFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                      className="bg-transparent text-slate-800 font-bold focus:outline-none"
                    >
                      <option value="ALL">Semua Source Data ({profile.field_mappings?.length || 0})</option>
                      {profile.sources?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.source_name} ({s.source_role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (profile.sources?.length === 0) {
                        alert("Silakan buat Data Source terlebih dahulu di tab Data Sources!");
                        return;
                      }
                      setEditingMappingId(null);
                      setMappingForm({
                        source_id: selectedSourceFilter !== "ALL" ? selectedSourceFilter : profile.sources[0].id,
                        source_field: "",
                        target_field: "",
                        data_type: "STRING",
                        field_order: (profile.field_mappings?.length || 0) + 1,
                        is_key: false,
                        is_compare: true,
                        is_required: false,
                        default_value: "",
                      });
                      setShowMappingModal(true);
                    }}
                    style={{ backgroundColor: "rgb(0, 103, 71)" }}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-bold text-xs shadow-sm hover:brightness-110 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Field Mapping</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4 font-mono">Source Data</th>
                      <th className="py-3.5 px-4 font-mono">Source Field</th>
                      <th className="py-3.5 px-4 font-mono">Target Field</th>
                      <th className="py-3.5 px-4">Data Type</th>
                      <th className="py-3.5 px-4 font-mono">Order</th>
                      <th className="py-3.5 px-4">Key Field</th>
                      <th className="py-3.5 px-4">Compare</th>
                      <th className="py-3.5 px-4">Required</th>
                      <th className="py-3.5 px-4">Default Value</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {filteredMappings.length === 0 ? (
                      <tr><td colSpan={10} className="py-8 text-center text-slate-400">Belum ada field mapping untuk source ini</td></tr>
                    ) : (
                      filteredMappings.map((fm: any) => {
                        const src = profile.sources?.find((s: any) => s.id === fm.source_id);
                        return (
                          <tr key={fm.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Source Data Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span 
                                style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", color: "rgb(0, 103, 71)" }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono border border-[rgba(0,103,71,0.2)] whitespace-nowrap inline-block shadow-2xs"
                              >
                                {src?.source_name || `Source #${fm.source_id}`}
                              </span>
                            </td>

                            {/* Source Field */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                              {fm.source_field}
                            </td>

                            {/* Target Field */}
                            <td className="py-3.5 px-4 font-mono text-[rgb(0,103,71)] font-bold text-xs whitespace-nowrap">
                              <span className="text-emerald-500 mr-1.5">→</span>
                              <span>{fm.target_field}</span>
                            </td>

                            {/* Data Type */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {fm.data_type}
                              </span>
                            </td>

                            {/* Order */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-extrabold text-xs border border-slate-200">
                                #{fm.field_order}
                              </span>
                            </td>

                            {/* Key Field */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {fm.is_key ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">
                                  KEY
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>

                            {/* Compare */}
                            <td className="py-3.5 px-4">
                              {fm.is_compare ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>

                            {/* Required */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {fm.is_required ? (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px]">
                                  REQ
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>

                            {/* Default Value */}
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                              {fm.default_value || "-"}
                            </td>

                            {/* Aksi (Edit & Delete) */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditMapping(fm)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-[rgb(0,103,71)] transition"
                                  title="Ubah / Change Field Mapping"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMapping(fm.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                  title="Hapus Field Mapping"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMPARE RULES ENGINE */}
          {activeTab === "rules" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Compare Rules Engine (Enhanced Matching)</h3>
                  <p className="text-xs text-slate-500">Aturan komparasi tingkat lanjut antar target_field (EXACT, TOLERANCE AMOUNT/TIME, REGEX, LOOKUP)</p>
                </div>
                <button
                  onClick={() => {
                    if (availableTargetFields.length > 0) {
                      setRuleForm((prev) => ({ ...prev, field_name: availableTargetFields[0] }));
                    }
                    setShowRuleModal(true);
                  }}
                  style={{ backgroundColor: "rgb(0, 103, 71)" }}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-bold text-xs shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Compare Rule</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.compare_rules?.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-slate-400 text-sm">Belum ada compare rule dikonfigurasikan</p>
                ) : (
                  profile.compare_rules?.map((r: any) => (
                    <div key={r.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-base font-extrabold text-slate-900">
                            Target Field: <span className="text-[rgb(0,103,71)]">{r.field_name}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span 
                              style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", color: "rgb(0, 103, 71)" }}
                              className="px-3 py-1 rounded-xl text-xs font-bold font-mono border border-[rgba(0,103,71,0.2)]"
                            >
                              {r.rule_type}
                            </span>
                            <button
                              onClick={() => handleDeleteRule(r.id)}
                              className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition"
                              title="Hapus Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Enhanced Rule Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
                          {r.rule_type === "TOLERANCE_AMOUNT" && (
                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-bold">
                              Toleransi Nominal: ± {r.tolerance_value || 0}
                            </span>
                          )}
                          {r.rule_type === "TOLERANCE_TIME" && (
                            <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl font-bold">
                              Time Drift: ± {r.tolerance_value || 0} detik
                            </span>
                          )}
                          {r.ignore_case && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-[11px]">Ignore Case</span>
                          )}
                          {r.ignore_trim && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-[11px]">Trim Whitespace</span>
                          )}
                          {r.null_equals_empty && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-[11px]">Null ↔ Empty</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SCHEDULER */}
          {activeTab === "schedule" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Dynamic Scheduler Setup</h3>
              <p className="text-xs text-slate-500">Penjadwalan otomatis eksekusi rekonsiliasi (CRON / Interval)</p>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Schedule Type</label>
                  <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-semibold">
                    <option value="CRON">CRON Expression</option>
                    <option value="INTERVAL">Interval Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CRON Expression</label>
                  <input
                    type="text"
                    defaultValue="0 1 * * *"
                    placeholder="0 1 * * *"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Eksekusi otomatis setiap hari jam 01:00 AM</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Add Source & Connection */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-900">
              {editingSourceId ? "Edit Sumber Data & Detail Koneksi" : "Tambah Sumber Data & Connection Detail"}
            </h3>
            <form onSubmit={handleAddSource} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Source</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Core Banking Host"
                    value={sourceForm.source_name}
                    onChange={(e) => setSourceForm({ ...sourceForm, source_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Role</label>
                  <select
                    value={sourceForm.source_role}
                    onChange={(e) => setSourceForm({ ...sourceForm, source_role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 font-semibold"
                  >
                    <option value="CORE">CORE</option>
                    <option value="PARTNER">PARTNER</option>
                    <option value="PRIMARY">PRIMARY</option>
                    <option value="SECONDARY">SECONDARY</option>
                    <option value="TARGET">TARGET</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Source Type</label>
                  <select
                    value={sourceForm.source_type}
                    onChange={(e) => setSourceForm({ ...sourceForm, source_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 font-semibold"
                  >
                    <option value="FILE">FILE</option>
                    <option value="FTP">FTP</option>
                    <option value="SFTP">SFTP</option>
                    <option value="API">REST API</option>
                    <option value="DATABASE">DATABASE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Priority Order</label>
                  <input
                    type="number"
                    value={sourceForm.priority_order}
                    onChange={(e) => setSourceForm({ ...sourceForm, priority_order: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* CONNECTION DETAILS FORM SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-[rgb(0,103,71)]" />
                  <span>Connection Details Config</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Host / Server IP</label>
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      value={sourceForm.host}
                      onChange={(e) => setSourceForm({ ...sourceForm, host: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Port</label>
                    <input
                      type="number"
                      placeholder="21 / 22 / 5432"
                      value={sourceForm.port}
                      onChange={(e) => setSourceForm({ ...sourceForm, port: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Username</label>
                    <input
                      type="text"
                      placeholder="db_user / ftp_user"
                      value={sourceForm.username}
                      onChange={(e) => setSourceForm({ ...sourceForm, username: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={sourceForm.password_encrypted}
                      onChange={(e) => setSourceForm({ ...sourceForm, password_encrypted: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                {sourceForm.source_type === "DATABASE" && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Database Engine / Driver</label>
                        <select
                          value={sourceForm.db_driver}
                          onChange={(e) => setSourceForm({ ...sourceForm, db_driver: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold"
                        >
                          <option value="IBM_DB2">IBM DB2 (ibm_db / AS400)</option>
                          <option value="POSTGRESQL">PostgreSQL</option>
                          <option value="ORACLE">Oracle DB (cx_Oracle)</option>
                          <option value="MSSQL">SQL Server (pyodbc)</option>
                          <option value="MYSQL">MySQL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Database Name</label>
                        <input
                          type="text"
                          placeholder="CORE_DB2"
                          value={sourceForm.database_name}
                          onChange={(e) => setSourceForm({ ...sourceForm, database_name: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Schema Name</label>
                        <input
                          type="text"
                          placeholder="COREDB"
                          value={sourceForm.schema_name}
                          onChange={(e) => setSourceForm({ ...sourceForm, schema_name: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-blue-600" />
                          <span>Dynamic SQL Query Template (Incremental Extraction)</span>
                        </label>
                        <span className="text-[10px] text-blue-700 font-semibold font-mono bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          Preview Today Filter: {resolvePreviewPattern(sourceForm.sql_query)}
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="SELECT TRX_REF_NO, TRX_AMOUNT, TRX_TIMESTAMP, STATUS_CODE FROM COREDB.TXN_HISTORY WHERE TRX_DATE = DATE('{YYYY-MM-DD}')"
                        value={sourceForm.sql_query}
                        onChange={(e) => setSourceForm({ ...sourceForm, sql_query: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Quick Insert Tokens:</span>
                        {["{YYYY-MM-DD}", "{YYYYMMDD}", "{YYYY-MM-DD-1}"].map((token) => (
                          <button
                            key={token}
                            type="button"
                            onClick={() => {
                              setSourceForm({ ...sourceForm, sql_query: sourceForm.sql_query + ` '${token}'` });
                            }}
                            className="px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-mono rounded-md border border-slate-200 text-[10px] transition-all shadow-sm"
                          >
                            + {token}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {sourceForm.source_type === "API" && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">REST API URL</label>
                      <input
                        type="text"
                        placeholder="https://api.partner.com/transactions"
                        value={sourceForm.api_url}
                        onChange={(e) => setSourceForm({ ...sourceForm, api_url: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Method</label>
                      <select
                        value={sourceForm.api_method}
                        onChange={(e) => setSourceForm({ ...sourceForm, api_method: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                      </select>
                    </div>
                  </div>
                )}

                {sourceForm.source_type === "SFTP" && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Private Key Path</label>
                    <input
                      type="text"
                      placeholder="/etc/ssl/sftp_rsa"
                      value={sourceForm.private_key_path}
                      onChange={(e) => setSourceForm({ ...sourceForm, private_key_path: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* FILE PARSER CONFIG FORM SECTION (Hidden when DATABASE) */}
              {sourceForm.source_type !== "DATABASE" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[rgb(0,103,71)]" />
                    <span>File Parser Config (CSV/TXT/JSON)</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase">File Pattern</label>
                        <span className="text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          Preview Today: {resolvePreviewPattern(sourceForm.file_pattern) || sourceForm.file_pattern}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="PLN_BILLER_{YYYYMMDD}.txt"
                        value={sourceForm.file_pattern}
                        onChange={(e) => setSourceForm({ ...sourceForm, file_pattern: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono mb-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Quick Insert Tokens:</span>
                        {["{YYYYMMDD}", "{YYYY-MM-DD}", "{DDMMYYYY}", "{YYYYMM}", "{YYYYMMDD-1}"].map((token) => (
                          <button
                            key={token}
                            type="button"
                            onClick={() => {
                              const current = sourceForm.file_pattern;
                              const updated = current.includes("*")
                                ? current.replace("*", token)
                                : current + token;
                              setSourceForm({ ...sourceForm, file_pattern: updated });
                            }}
                            className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 font-mono rounded-md border border-slate-200 text-[10px] transition-all shadow-sm"
                          >
                            + {token}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">File Type</label>
                      <select
                        value={sourceForm.file_type}
                        onChange={(e) => setSourceForm({ ...sourceForm, file_type: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold"
                      >
                        <option value="CSV">CSV</option>
                        <option value="TXT">TXT</option>
                        <option value="EXCEL">EXCEL</option>
                        <option value="JSON">JSON</option>
                      </select>
                    </div>

                    {sourceForm.file_type === "EXCEL" && (
                      <div className="col-span-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2">
                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                          <span>📊 Pengaturan Khusus Excel Parser</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-emerald-900 mb-1">Sheet Name</label>
                            <input
                              type="text"
                              placeholder="Sheet1"
                              value={sourceForm.sheet_name}
                              onChange={(e) => setSourceForm({ ...sourceForm, sheet_name: e.target.value })}
                              className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-emerald-900 mb-1">Start Cell (misal: B5)</label>
                            <input
                              type="text"
                              placeholder="B5"
                              value={sourceForm.start_cell}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                const match = val.trim().match(/^([A-Z]+)(\d+)$/);
                                let hRow = sourceForm.header_row;
                                let dRow = sourceForm.data_start_row;
                                if (match) {
                                  const rowNum = parseInt(match[2], 10);
                                  if (!isNaN(rowNum) && rowNum > 0) {
                                    hRow = rowNum;
                                    dRow = rowNum + 1;
                                  }
                                }
                                setSourceForm({
                                  ...sourceForm,
                                  start_cell: val,
                                  header_row: hRow,
                                  data_start_row: dRow,
                                });
                              }}
                              className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs font-mono font-bold text-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-emerald-900 mb-1">Header Row</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="5"
                              value={sourceForm.header_row}
                              onChange={(e) => setSourceForm({ ...sourceForm, header_row: Number(e.target.value) || 1 })}
                              className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-emerald-900 mb-1">Data Start Row</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="6"
                              value={sourceForm.data_start_row}
                              onChange={(e) => setSourceForm({ ...sourceForm, data_start_row: Number(e.target.value) || 2 })}
                              className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs font-mono"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-700 italic">
                          * Memasukkan Start Cell <span className="font-bold">B5</span> akan otomatis mengatur Header Row ke <span className="font-bold">5</span> dan Data Start Row ke <span className="font-bold">6</span>.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Delimiter</label>
                      <input
                        type="text"
                        placeholder=","
                        value={sourceForm.delimiter}
                        onChange={(e) => setSourceForm({ ...sourceForm, delimiter: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Enclosure Char</label>
                      <input
                        type="text"
                        placeholder='"'
                        value={sourceForm.enclosure_char}
                        onChange={(e) => setSourceForm({ ...sourceForm, enclosure_char: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Encoding</label>
                      <input
                        type="text"
                        placeholder="UTF-8"
                        value={sourceForm.encoding}
                        onChange={(e) => setSourceForm({ ...sourceForm, encoding: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date Format</label>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD HH:mm:ss"
                        value={sourceForm.date_format}
                        onChange={(e) => setSourceForm({ ...sourceForm, date_format: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Decimal Sep</label>
                      <input
                        type="text"
                        placeholder="."
                        value={sourceForm.decimal_separator}
                        onChange={(e) => setSourceForm({ ...sourceForm, decimal_separator: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Thousand Sep</label>
                      <input
                        type="text"
                        placeholder=","
                        value={sourceForm.thousand_separator}
                        onChange={(e) => setSourceForm({ ...sourceForm, thousand_separator: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={sourceForm.has_header}
                          onChange={(e) => setSourceForm({ ...sourceForm, has_header: e.target.checked })}
                          className="rounded text-[rgb(0,103,71)]"
                        />
                        <span>Has Header</span>
                      </label>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Archive Directory Path</label>
                      <input
                        type="text"
                        placeholder="/var/archive/pln/"
                        value={sourceForm.archive_path}
                        onChange={(e) => setSourceForm({ ...sourceForm, archive_path: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TEST CONNECTION DIAGNOSTIC BANNER */}
              {testResult && (
                <div
                  className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? "Tes Koneksi Berhasil" : "Tes Koneksi Gagal"}</div>
                    <div className="text-[11px] font-mono mt-0.5">{testResult.message}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConn}
                  className="px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Server className={`w-3.5 h-3.5 ${testingConn ? "animate-spin" : ""}`} />
                  <span>{testingConn ? "Testing..." : "Tes Koneksi"}</span>
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowSourceModal(false)} className="px-4 py-2 rounded-2xl text-slate-500 font-semibold text-sm">
                    Batal
                  </button>
                  <button type="submit" style={{ backgroundColor: "rgb(0, 103, 71)" }} className="px-4 py-2 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity">
                    Simpan Source & Connection
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Field Mapping */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              {editingMappingId ? "Ubah / Edit Field Mapping" : "Tambah Field Mapping untuk Source File"}
            </h3>
            <form onSubmit={handleSaveMapping} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Data Source File / Connection</label>
                <select
                  value={mappingForm.source_id}
                  onChange={(e) => setMappingForm({ ...mappingForm, source_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 font-bold"
                >
                  {profile.sources?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.source_name} ({s.source_role} - {s.source_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Source Field Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: TRX_AMOUNT atau COALESCE(A,B)"
                    value={mappingForm.source_field}
                    onChange={(e) => setMappingForm({ ...mappingForm, source_field: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Field Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: amount"
                    value={mappingForm.target_field}
                    onChange={(e) => setMappingForm({ ...mappingForm, target_field: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Data Type</label>
                  <select
                    value={mappingForm.data_type}
                    onChange={(e) => setMappingForm({ ...mappingForm, data_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-semibold"
                  >
                    <option value="STRING">STRING</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="DATETIME">DATETIME</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Field Order</label>
                  <input
                    type="number"
                    value={mappingForm.field_order}
                    onChange={(e) => setMappingForm({ ...mappingForm, field_order: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Default Value</label>
                  <input
                    type="text"
                    placeholder="Opsional"
                    value={mappingForm.default_value}
                    onChange={(e) => setMappingForm({ ...mappingForm, default_value: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={mappingForm.is_key}
                    onChange={(e) => setMappingForm({ ...mappingForm, is_key: e.target.checked })}
                    className="rounded text-[rgb(0,103,71)]"
                  />
                  <span>Is Key (Compare Key)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={mappingForm.is_compare}
                    onChange={(e) => setMappingForm({ ...mappingForm, is_compare: e.target.checked })}
                    className="rounded text-[rgb(0,103,71)]"
                  />
                  <span>Is Compare</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={mappingForm.is_required}
                    onChange={(e) => setMappingForm({ ...mappingForm, is_required: e.target.checked })}
                    className="rounded text-[rgb(0,103,71)]"
                  />
                  <span>Is Required</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowMappingModal(false);
                    setEditingMappingId(null);
                  }}
                  className="px-4 py-2 rounded-2xl text-slate-500 font-semibold text-sm"
                >
                  Batal
                </button>
                <button type="submit" style={{ backgroundColor: "rgb(0, 103, 71)" }} className="px-4 py-2 rounded-2xl text-white font-bold text-sm">
                  {editingMappingId ? "Simpan Perubahan" : "Simpan Field Mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Compare Rule */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Tambah Compare Rule (Enhanced Matching)</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Field Name (Terdaftar di Mapping)</label>
                {availableTargetFields.length > 0 ? (
                  <select
                    value={ruleForm.field_name}
                    onChange={(e) => setRuleForm({ ...ruleForm, field_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-mono font-bold text-slate-900"
                  >
                    {availableTargetFields.map((tf) => (
                      <option key={tf} value={tf}>
                        {tf}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: amount"
                    value={ruleForm.field_name}
                    onChange={(e) => setRuleForm({ ...ruleForm, field_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-mono"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rule Type</label>
                  <select
                    value={ruleForm.rule_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, rule_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-semibold"
                  >
                    <option value="EXACT">EXACT (100% Persis)</option>
                    <option value="TOLERANCE_AMOUNT">TOLERANCE_AMOUNT (Nominal Rp)</option>
                    <option value="TOLERANCE_TIME">TOLERANCE_TIME (Detik Time Drift)</option>
                    <option value="REGEX_EXTRACT">REGEX_EXTRACT (Pattern Matching)</option>
                    <option value="LOOKUP_TRANSLATION">LOOKUP_TRANSLATION (Status Map)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    {ruleForm.rule_type === "TOLERANCE_TIME" ? "Toleransi Waktu (Detik)" : "Tolerance Value (Nominal)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={ruleForm.rule_type === "TOLERANCE_TIME" ? "300 (5 menit)" : "500.00"}
                    value={ruleForm.tolerance_value}
                    onChange={(e) => setRuleForm({ ...ruleForm, tolerance_value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Advanced Flags */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Match Comparison Flags</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={ruleForm.ignore_case}
                      onChange={(e) => setRuleForm({ ...ruleForm, ignore_case: e.target.checked })}
                      className="rounded text-[rgb(0,103,71)]"
                    />
                    <span>Ignore Case</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={ruleForm.ignore_trim}
                      onChange={(e) => setRuleForm({ ...ruleForm, ignore_trim: e.target.checked })}
                      className="rounded text-[rgb(0,103,71)]"
                    />
                    <span>Ignore Trim</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={ruleForm.null_equals_empty}
                      onChange={(e) => setRuleForm({ ...ruleForm, null_equals_empty: e.target.checked })}
                      className="rounded text-[rgb(0,103,71)]"
                    />
                    <span>Null = Empty</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowRuleModal(false)} className="px-4 py-2 rounded-2xl text-slate-500 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" style={{ backgroundColor: "rgb(0, 103, 71)" }} className="px-4 py-2 rounded-2xl text-white font-bold text-sm">
                  Simpan Compare Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
