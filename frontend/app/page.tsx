export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          iRekon System Architecture Setup
        </h1>
        <p className="text-slate-300 text-center max-w-2xl">
          Automated Transaction Reconciliation Application Platform. Phase 1 Infrastructure initialized.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-6">
          <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-blue-400">FastAPI Backend</h2>
            <p className="text-sm text-slate-400 mt-2">REST API, SQLAlchemy 2, Pydantic v2 & JWT Auth</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-indigo-400">Message Queue</h2>
            <p className="text-sm text-slate-400 mt-2">RabbitMQ & Dramatiq Workers</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-purple-400">Storage & Monitoring</h2>
            <p className="text-sm text-slate-400 mt-2">PostgreSQL 16, Redis 7, MinIO, Prometheus & Grafana</p>
          </div>
        </div>
      </div>
    </main>
  );
}
