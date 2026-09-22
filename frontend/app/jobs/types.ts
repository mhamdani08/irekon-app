export type JobStatus = "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface JobLogLine {
  level: "stdout" | "stderr";
  message: string;
  timestamp: string;
}

export interface Job {
  id: string;
  name: string;
  triggeredBy: string;
  status: JobStatus;
  progressCurrent: number;
  progressTotal: number;
  startedAt: string;
  durationSeconds: number;
  params: Record<string, unknown>;
  logs: JobLogLine[];
  errorStack?: string;
}

export interface BrokerSnapshot {
  rabbitmq: {
    connected: boolean;
    consumers: number;
    queues: { name: string; messages: number }[];
  };
  redis: {
    connected: boolean;
    memoryUsedMb: number;
    memoryLimitMb: number;
  };
  workers: {
    active: number;
    total: number;
    cpuPercent: number;
    memoryPercent: number;
  };
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

const TASK_NAMES = ["process_recon_run", "sftp_file_fetcher", "export_report_pdf", "ftp_archive_sync"];
const USERS = ["budi.santoso", "Cron Scheduler", "rina.wijaya"];

function randomJob(index: number, forcedStatus?: JobStatus): Job {
  const statuses: JobStatus[] = ["QUEUED", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"];
  const status = forcedStatus ?? statuses[Math.floor(Math.random() * statuses.length)];
  const total = 10000;
  const current =
    status === "SUCCESS" ? total : status === "QUEUED" ? 0 : Math.floor(Math.random() * total);
  const duration = status === "QUEUED" ? 0 : Math.floor(Math.random() * 600) + 5;

  return {
    id: `JOB-${8800 + index}`,
    name: TASK_NAMES[index % TASK_NAMES.length],
    triggeredBy: USERS[index % USERS.length],
    status,
    progressCurrent: current,
    progressTotal: total,
    startedAt: new Date(Date.now() - duration * 1000).toISOString(),
    durationSeconds: duration,
    params: {
      run_id: `RUN-${2026}-${(index + 1).toString().padStart(3, "0")}`,
      source: "bank_statement_batch_09",
      match_threshold: 0.92,
    },
    logs: [
      { level: "stdout", message: `Starting task ${TASK_NAMES[index % TASK_NAMES.length]}...`, timestamp: "00:00:00" },
      { level: "stdout", message: "Connecting to data source...", timestamp: "00:00:01" },
      { level: "stdout", message: `Matched ${current}/${total} records so far`, timestamp: "00:00:04" },
      ...(status === "FAILED"
        ? [{ level: "stderr" as const, message: "ValueError: unable to parse row 4821 (malformed amount field)", timestamp: "00:00:06" }]
        : []),
    ],
    errorStack:
      status === "FAILED"
        ? `Traceback (most recent call last):\n  File "worker/tasks/recon.py", line 88, in process_recon_run\n    amount = parse_amount(row["amount"])\n  File "worker/utils/parsing.py", line 21, in parse_amount\n    raise ValueError(f"unable to parse row {row_id} (malformed amount field)")\nValueError: unable to parse row 4821 (malformed amount field)`
        : undefined,
  };
}

export function generateMockJobs(): Job[] {
  return [
    randomJob(21, "RUNNING"),
    randomJob(20, "SUCCESS"),
    randomJob(19, "FAILED"),
    randomJob(18, "QUEUED"),
    randomJob(17, "RUNNING"),
    randomJob(16, "SUCCESS"),
    randomJob(15, "CANCELLED"),
    randomJob(14, "SUCCESS"),
  ];
}

export function generateMockBrokerSnapshot(): BrokerSnapshot {
  return {
    rabbitmq: {
      connected: true,
      consumers: 3,
      queues: [
        { name: "default", messages: 5 },
        { name: "recon_high_priority", messages: 2 },
      ],
    },
    redis: {
      connected: true,
      memoryUsedMb: 84,
      memoryLimitMb: 512,
    },
    workers: {
      active: 3,
      total: 3,
      cpuPercent: 42,
      memoryPercent: 58,
    },
  };
}