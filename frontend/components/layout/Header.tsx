"use client";

import { useAuthStore } from "@/store/authStore";
import { LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const primaryRole = user?.roles?.[0]?.role_name || "User";

  return (
    <header className="h-16 bg-white/90 border-b border-slate-200 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Welcome,</span>
        <span style={{ color: "rgb(0, 103, 71)" }} className="text-sm font-extrabold">{user?.full_name || user?.username}</span>
      </div>

      <div className="flex items-center gap-4">
        <div 
          style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
          className="flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold"
        >
          <Shield className="w-3.5 h-3.5 text-[rgb(0,103,71)]" />
          <span>{primaryRole}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
