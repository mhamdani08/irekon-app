"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import BrandLogo from "@/components/common/BrandLogo";
import { Lock, User as UserIcon, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch<any>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res.data) {
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("refresh_token", res.data.refresh_token);

        // Fetch dynamic user menu
        const menuRes = await apiFetch<any>("/api/v1/menus/user-menu");

        setAuth(res.data.user, res.data.permissions, menuRes.data || []);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Gagal melakukan login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandLogo size="lg" className="mb-4" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">iRekon Apps</h1>
          <p className="text-sm text-slate-500 mt-1">Silakan masuk ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[rgb(0,103,71)] focus:ring-2 focus:ring-[rgba(0,103,71,0.2)] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[rgb(0,103,71)] focus:ring-2 focus:ring-[rgba(0,103,71,0.2)] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: "rgb(0, 103, 71)" }}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg shadow-emerald-900/10 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50 mt-2"
          >
            {loading ? "Memproses Login..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Default Admin: <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">admin</code> / <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">admin123</code>
          </p>
        </div>
      </div>
    </main>
  );
}
