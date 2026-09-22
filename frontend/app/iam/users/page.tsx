"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { Users, UserPlus, Check, X, Search, Edit3 } from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    employee_no: "",
    role_ids: [] as number[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, roleRes] = await Promise.all([
        apiFetch<any>("/api/v1/users"),
        apiFetch<any>("/api/v1/roles"),
      ]);
      setUsers(userRes.data || []);
      setRoles(roleRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      setFormData({ username: "", full_name: "", email: "", password: "", employee_no: "", role_ids: [] });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
              <p className="text-sm text-slate-500 mt-1">Kelola akun pengguna, status keaktifan, dan penugasan role RBAC</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: "rgb(0, 103, 71)" }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:brightness-110 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan username atau nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[rgb(0,103,71)] transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Employee No</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Roles</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">Memuat data pengguna...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada pengguna ditemukan</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-xs text-slate-400">@{u.username}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-mono text-xs">{u.employee_no || "-"}</td>
                        <td className="py-4 px-4 text-slate-500">{u.email || "-"}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r: any) => (
                              <span 
                                key={r.id}
                                style={{ backgroundColor: "rgba(0, 103, 71, 0.08)", borderColor: "rgba(0, 103, 71, 0.2)", color: "rgb(0, 103, 71)" }}
                                className="px-2.5 py-0.5 rounded-lg border text-xs font-bold"
                              >
                                {r.role_name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                              <X className="w-3 h-3 text-red-500" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="text-slate-400 hover:text-[rgb(0,103,71)] p-1 rounded-lg hover:bg-slate-100 transition">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Tambah Pengguna Baru</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-[rgb(0,103,71)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pilih Role</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {roles.map((r) => {
                    const isChecked = formData.role_ids.includes(r.id);
                    return (
                      <label key={r.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, role_ids: [...formData.role_ids, r.id] });
                            } else {
                              setFormData({ ...formData, role_ids: formData.role_ids.filter((id) => id !== r.id) });
                            }
                          }}
                          className="rounded text-[rgb(0,103,71)] focus:ring-[rgb(0,103,71)]"
                        />
                        <span className="font-semibold">{r.role_name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-2xl text-slate-500 hover:text-slate-900 font-semibold text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "rgb(0, 103, 71)" }}
                  className="px-4 py-2 rounded-2xl text-white font-bold text-sm shadow-md shadow-emerald-900/10"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
