"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, FileText, RotateCcw, XCircle, Database, Server, Radio, Activity } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import JobMetricsCards from "@/components/JobMetricsCards";
import JobLogsDrawer from "@/components/JobLogsDrawer";
import {
  type Job,
  type JobStatus,
  generateMockJobs,
  generateMockBrokerSnapshot,
  formatDuration,
} from "./types";

const REFRESH_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "3s", value: 3000 },
  { label: "5s", value: 5000 },
  { label: "10s", value: 10000 },
] as const;

const STATUS_STYLES: Record<JobStatus, string> = {
  QUEUED: "bg-amber-50 text-amber-700 border-amber-200",
  RUNNING: "bg-sky-50 text-sky-700 border-sky-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function JobMonitorPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [broker, setBroker] = useState(() => generateMockBrokerSnapshot());
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchJobs = () => {
    // TODO: replace with real polling call, e.g. fetch(`${API_BASE}/api/jobs`)
    setJobs(generateMockJobs());
    setBroker(generateMockBrokerSnapshot());
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (refreshInterval === 0) return;
    const id = setInterval(fetchJobs, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesQuery =
        query.trim() === "" ||
        job.id.toLowerCase().includes(query.toLowerCase()) ||
        job.name.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [jobs, query, statusFilter]);

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
                <Activity className="w-7 h-7 text-brand" />
                <span>Background Job & Task Monitor</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitoring aktivitas background worker, antrean RabbitMQ, dan status proses pipeline rekonsiliasi secara live.
              </p>
            </div>
          </div>

          <JobMetricsCards jobs={jobs} broker={broker} />

          {/* Broker / Worker status row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800 mb-2">
                <Radio size={16} className="text-brand" />
                <p className="text-sm font-bold">RabbitMQ</p>
              </div>
              <p className="text-xs text-slate-500">
                {broker.rabbitmq.consumers} consumer aktif
              </p>
              {broker.rabbitmq.queues.map((q) => (
                <p key={q.name} className="text-xs text-slate-500">
                  {q.name}: <span className="text-slate-700 font-semibold">{q.messages} pesan</span>
                </p>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800 mb-2">
                <Database size={16} className="text-brand" />
                <p className="text-sm font-bold">Redis Cache</p>
              </div>
              <p className="text-xs text-slate-500">
                Memory: <span className="text-slate-700 font-semibold">{broker.redis.memoryUsedMb} / {broker.redis.memoryLimitMb} MB</span>
              </p>
              <p className="text-xs text-slate-500">
                Status: <span className="text-emerald-600 font-semibold">Connected</span>
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800 mb-2">
                <Server size={16} className="text-brand" />
                <p className="text-sm font-bold">Worker Threads</p>
              </div>
              <p className="text-xs text-slate-500">
                CPU: <span className="text-slate-700 font-semibold">{broker.workers.cpuPercent}%</span> · Memory:{" "}
                <span className="text-slate-700 font-semibold">{broker.workers.memoryPercent}%</span>
              </p>
            </div>
          </section>

          {/* Search & Filters */}
          <section className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari Job ID atau Job Name..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as JobStatus | "ALL")}
                className="bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand"
              >
                <option value="ALL">Semua status</option>
                <option value="QUEUED">Queued</option>
                <option value="RUNNING">Running</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand"
              >
                {REFRESH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Auto-refresh: {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchJobs}
                style={{ backgroundColor: "rgb(0, 103, 71)" }}
                className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/10 hover:opacity-95 transition"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </section>

          {lastRefreshed && (
            <p className="text-xs text-slate-400 -mt-3">
              Terakhir diperbarui: {lastRefreshed.toLocaleTimeString("id-ID")}
            </p>
          )}

          {/* Job Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Job ID & Name</th>
                    <th className="py-3 px-4">Triggered By</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {filteredJobs.map((job) => {
                    const pct = Math.round((job.progressCurrent / job.progressTotal) * 100);
                    return (
                      <tr key={job.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-4">
                          <p className="font-mono font-bold text-slate-900">{job.id}</p>
                          <p className="text-xs text-slate-500">{job.name}</p>
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-xs font-semibold">{job.triggeredBy}</td>
                        <td className="py-4 px-4 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full ${job.status === "FAILED" ? "bg-red-500" : "bg-brand"}`}
                                style={job.status !== "FAILED" ? { width: `${pct}%`, backgroundColor: "rgb(0, 103, 71)" } : { width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                              {pct}% · {job.progressCurrent.toLocaleString("id-ID")}/{job.progressTotal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-mono text-xs">
                          {formatDuration(job.durationSeconds)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${STATUS_STYLES[job.status]}`}
                          >
                            {job.status === "RUNNING" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                            )}
                            {job.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="View logs"
                            >
                              <FileText size={16} />
                            </button>
                            {job.status === "FAILED" && (
                              <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Retry job">
                                <RotateCcw size={16} />
                              </button>
                            )}
                            {job.status === "RUNNING" && (
                              <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Cancel job">
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada job yang cocok dengan pencarian atau filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <JobLogsDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}