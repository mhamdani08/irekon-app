"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore, MenuItem } from "@/store/authStore";
import BrandLogo from "@/components/common/BrandLogo";
import { apiFetch } from "@/lib/api";
import {
  LayoutDashboard,
  GitCompare,
  Activity,
  FileText,
  Users,
  ShieldCheck,
  Sliders,
  Building2,
  ChevronRight,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  GitCompare,
  Activity,
  FileText,
  Users,
  ShieldCheck,
  Sliders,
  Building2,
};

const FALLBACK_MENUS: MenuItem[] = [
  {
    id: "1",
    menu_code: "dashboard",
    menu_name: "Dashboard",
    route: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    id: "2",
    menu_code: "recon_config",
    menu_name: "Master Configuration",
    route: "/recon-config",
    icon: "Sliders",
  },
  {
    id: "3",
    menu_code: "reconciliation",
    menu_name: "Reconciliation",
    route: "/reconciliation",
    icon: "GitCompare",
  },
  {
    id: "4",
    menu_code: "job_monitor",
    menu_name: "Job Monitor",
    route: "/jobs",
    icon: "Activity",
  },
  {
    id: "5",
    menu_code: "reports",
    menu_name: "Reports & Audit",
    route: "/reports",
    icon: "FileText",
  },
  {
    id: "6",
    menu_code: "iam_user",
    menu_name: "User Management",
    route: "/iam/users",
    icon: "Users",
  },
  {
    id: "7",
    menu_code: "iam_role",
    menu_name: "Role Management",
    route: "/iam/roles",
    icon: "ShieldCheck",
  },
  {
    id: "8",
    menu_code: "company_setup",
    menu_name: "Company Setup",
    route: "/company-setup",
    icon: "Building2",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { menus, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const safeMenus =
    Array.isArray(menus) && menus.length > 0 ? menus : FALLBACK_MENUS;

 useEffect(() => {
    if (!hasFetched && (!menus || !Array.isArray(menus) || menus.length === 0)) {
      setHasFetched(true);
      setLoading(true);
      Promise.all([
        apiFetch<any>("/api/v1/auth/me"),
        apiFetch<any>("/api/v1/menus/user-menu")
      ])
        .then(([meRes, menuRes]) => {
          if (meRes.data) {
            setAuth(meRes.data.user, meRes.data.permissions || [], menuRes.data || []);
          }
        })
        .catch((err) => {
          console.error("Failed to load user menus from Menu Management:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [menus, setAuth, hasFetched]);
  // ... sisanya sama

  const renderIcon = (iconName?: string) => {
    if (!iconName || !ICON_MAP[iconName]) {
      return <Sliders className="w-5 h-5" />;
    }
    const IconComponent = ICON_MAP[iconName];
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-slate-800 flex flex-col h-screen sticky top-0 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <BrandLogo size="sm" />
        <div>
          <h1 className="font-extrabold text-base text-slate-900 tracking-wide">
            iRekon Apps
          </h1>
          <p
            style={{ color: "rgb(0, 103, 71)" }}
            className="text-[10px] font-bold tracking-wider uppercase"
          >
            Reconciliation System
          </p>
        </div>
      </div>

      {/* Dynamic Menu Navigation from Backend DB */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation Menu
        </div>

        {loading && safeMenus.length === 0 ? (
          <div className="p-4 text-xs font-semibold text-slate-400 space-y-2">
            <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : (
          safeMenus.map((item: MenuItem) => {
            const isActive =
              pathname === item.route ||
              (item.route !== "/" && pathname.startsWith(item.route + "/"));
            return (
              <Link
                key={item.id || item.menu_code}
                href={item.route || "#"}
                style={isActive ? { backgroundColor: "rgb(0, 103, 71)" } : {}}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-white shadow-md shadow-emerald-900/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {renderIcon(item.icon)}
                <span className="flex-1">{item.menu_name}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
