"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuthStore } from "@/store/authStore";
import { apiFetch } from "@/lib/api";
import { Shield, Users, Activity, FileText, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!isAuthenticated) {
      apiFetch<any>("/api/v1/auth/me")
        .then(async (res) => {
          if (res.data) {
            const menuRes = await apiFetch<any>("/api/v1/menus/user-menu");
            setAuth(res.data.user, res.data.permissions, menuRes.data || []);
          }
        })
        .catch(() => router.push("/login"));
    }
  }, [isAuthenticated, router, setAuth]);

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-medium">
        Memuat sesi iRekon...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
              <p className="text-sm text-slate-500 mt-1">iRekon System</p>
            </div>
            <div
              style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>RBAC Engine Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div
                style={{ backgroundColor: "rgba(0, 103, 71, 0.1)", color: "rgb(0, 103, 71)" }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
              >
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Active User</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{user?.full_name}</h3>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Assigned Roles</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{user?.roles?.length || 0} Roles</h3>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Auth Provider</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{user?.auth_provider || "LOCAL"}</h3>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div
                style={{ backgroundColor: "rgba(0, 103, 71, 0.1)", color: "rgb(0, 103, 71)" }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
              >
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">System Status</p>
                <h3 style={{ color: "rgb(0, 103, 71)" }} className="text-lg font-bold mt-0.5">Online</h3>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Assigned Permissions & Capabilities</h2>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.flatMap((r) => r.permissions || []).map((p, idx) => (
                <span
                  key={idx}
                  style={{ backgroundColor: "rgba(0, 103, 71, 0.06)", borderColor: "rgba(0, 103, 71, 0.15)", color: "rgb(0, 103, 71)" }}
                  className="px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold"
                >
                  {p.permission_code}
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
