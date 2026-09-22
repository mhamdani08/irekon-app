"use client";

import { X, Copy, Download } from "lucide-react";
import type { Job } from "@/app/jobs/types";

interface JobLogsDrawerProps {
  job: Job | null;
  onClose: () => void;
}

export default function JobLogsDrawer({ job, onClose }: JobLogsDrawerProps) {
  if (!job) return null;

  const logText = job.logs.map((l) => `[${l.timestamp}] ${l.level.toUpperCase()}  ${l.message}`).join("\n");
  const fullLog = job.errorStack ? `${logText}\n\n${job.errorStack}` : logText;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLog);
  };

  const handleDownload = () => {
    const blob = new Blob([fullLog], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.id}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <p className="text-sm text-slate-400">{job.id}</p>
            <h2 className="text-lg font-semibold text-slate-50">{job.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Close log viewer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Copy size={14} /> Copy logs
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Download size={14} /> Download log file
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-800">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Input parameters</p>
          <pre className="text-xs text-slate-300 bg-slate-950 rounded-md p-3 overflow-x-auto">
{JSON.stringify(job.params, null, 2)}
          </pre>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950 px-5 py-4 font-mono text-xs leading-relaxed">
          {job.logs.map((line, i) => (
            <p key={i} className={line.level === "stderr" ? "text-rose-400" : "text-slate-300"}>
              <span className="text-slate-600">[{line.timestamp}]</span> {line.message}
            </p>
          ))}

          {job.errorStack && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-rose-400 mb-2">Stack trace</p>
              <pre className="text-rose-300 whitespace-pre-wrap">{job.errorStack}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}