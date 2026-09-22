"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { ShieldCheck, Check, Edit3 } from "lucide-react";

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        apiFetch<any>("/api/v1/roles"),
        apiFetch<any>("/api/v1/roles/permissions/groups"),
      ]);
      setRoles(roleRes.data || []);
      setPermissionGroups(permRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openMatrixEditor = (role: any) => {
    setSelectedRole(role);
    const existingIds = role.permissions.map((p: any) => p.id);
    setSelectedPermIds(existingIds);
  };

  const handleSaveMatrix = async () => {
    if (!selectedRole) return;
    try {
      await apiFetch(`/api/v1/roles/${selectedRole.id}`, {
        method: "PUT",
        body: JSON.stringify({ permission_ids: selectedPermIds }),
      });
      setSelectedRole(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const togglePermission = (permId: number) => {
    if (selectedPermIds.includes(permId)) {
      setSelectedPermIds(selectedPermIds.filter((id) => id !== permId));
    } else {
      setSelectedPermIds([...selectedPermIds, permId]);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Role & Permission Management</h1>
              <p className="text-sm text-slate-500 mt-1">Kelola master role dan matrik izin otorisasi (*permission matrix*)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
                      className="px-3 py-1 rounded-xl border font-mono text-xs font-bold"
                    >
                      {role.role_code}
                    </div>
                    {role.is_system && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        System Role
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{role.role_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{role.description || "Tidak ada deskripsi"}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">
                    {role.permissions.length} Permissions
                  </span>
                  <button
                    onClick={() => openMatrixEditor(role)}
                    style={{ color: "rgb(0, 103, 71)" }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold transition border border-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Matrix</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Permission Matrix Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Matriks Izin Otorisasi: {selectedRole.role_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Centang akses yang ingin diberikan untuk role ini</p>
              </div>
              <span 
                style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
                className="px-3 py-1 rounded-xl border font-mono text-xs font-bold"
              >
                {selectedRole.role_code}
              </span>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {permissionGroups.map((group) => (
                <div key={group.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ShieldCheck style={{ color: "rgb(0, 103, 71)" }} className="w-4 h-4" />
                    <span>{group.group_name}</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.permissions.map((perm: any) => {
                      const isChecked = selectedPermIds.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          style={isChecked ? { backgroundColor: "rgba(0, 103, 71, 0.06)", borderColor: "rgba(0, 103, 71, 0.25)" } : {}}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isChecked
                              ? "text-slate-900 font-semibold"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{perm.permission_name}</div>
                            <div className="text-[11px] font-mono text-slate-500">{perm.permission_code}</div>
                          </div>
                          <div 
                            style={isChecked ? { backgroundColor: "rgb(0, 103, 71)", borderColor: "rgb(0, 103, 71)" } : {}}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                              isChecked ? "text-white" : "border-slate-300 bg-slate-50"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 rounded-2xl text-slate-500 hover:text-slate-900 font-semibold text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMatrix}
                style={{ backgroundColor: "rgb(0, 103, 71)" }}
                className="px-4 py-2 rounded-2xl text-white font-bold text-sm shadow-md shadow-emerald-900/10"
              >
                Simpan Matriks Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
