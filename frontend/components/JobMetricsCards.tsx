"use client";

import { Activity, Clock, AlertTriangle, Cpu } from "lucide-react";
import type { Job, BrokerSnapshot } from "@/app/jobs/types";

interface JobMetricsCardsProps {
  jobs: Job[];
  broker: BrokerSnapshot;
}

function MetricCard({
  label,
  value,
  sublabel,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ReactNode;
  tone: "running" | "queued" | "failed" | "healthy";
}) {
  const toneStyles: Record<typeof tone, string> = {
    running: "border-sky-200 bg-sky-50",
    queued: "border-amber-200 bg-amber-50",
    failed: "border-red-200 bg-red-50",
    healthy: "border-emerald-200 bg-emerald-50",
  };
  const iconTone: Record<typeof tone, string> = {
    running: "text-sky-600",
    queued: "text-amber-600",
    failed: "text-red-600",
    healthy: "text-emerald-600",
  };

  return (
    <div className={`rounded-3xl border ${toneStyles[tone]} p-5 flex items-start justify-between shadow-sm`}>
      <div>
        <p className="text-xs uppercase tracking-wide font-bold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
      </div>
      <div className={`${iconTone[tone]} mt-0.5`}>{icon}</div>
    </div>
  );
}

export default function JobMetricsCards({ jobs, broker }: JobMetricsCardsProps) {
  const running = jobs.filter((j) => j.status === "RUNNING").length;
  const queued = jobs.filter((j) => j.status === "QUEUED").length;
  const failed = jobs.filter((j) => j.status === "FAILED").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Running Jobs"
        value={String(running)}
        sublabel={running > 0 ? "Active right now" : "Idle"}
        icon={<Activity size={20} className={running > 0 ? "animate-pulse" : ""} />}
        tone="running"
      />
      <MetricCard
        label="Queued Tasks"
        value={String(queued)}
        sublabel="Waiting in RabbitMQ"
        icon={<Clock size={20} />}
        tone="queued"
      />
      <MetricCard
        label="Failed Jobs (24h)"
        value={String(failed)}
        sublabel={failed > 0 ? "Needs attention" : "No failures"}
        icon={<AlertTriangle size={20} />}
        tone="failed"
      />
      <MetricCard
        label="Worker Nodes Health"
        value={`${broker.workers.active}/${broker.workers.total}`}
        sublabel="Active workers"
        icon={<Cpu size={20} />}
        tone="healthy"
      />
    </div>
  );
}