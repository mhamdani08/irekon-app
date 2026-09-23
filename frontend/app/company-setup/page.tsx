"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import {
  Building2,
  Edit3,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";

interface CompanyProfile {
  id: number;
  company_code: string;
  company_name: string;
  legal_name: string;
  tax_id?: string | null;
  logo_url?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

const emptyForm = {
  company_code: "DEFAULT",
  company_name: "",
  legal_name: "",
  tax_id: "",
  address_line1: "",
  address_line2: "",
  city: "",
  province: "",
  postal_code: "",
  country: "",
  phone: "",
  email: "",
  website: "",
};

export default function CompanySetupPage() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<CompanyProfile | null>("/api/v1/company");
      setCompany(res.data || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setIsEditing(true);
  };

  const openEditForm = () => {
    if (!company) return;
    setForm({
      company_code: company.company_code,
      company_name: company.company_name,
      legal_name: company.legal_name,
      tax_id: company.tax_id || "",
      address_line1: company.address_line1 || "",
      address_line2: company.address_line2 || "",
      city: company.city || "",
      province: company.province || "",
      postal_code: company.postal_code || "",
      country: company.country || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
    });
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (company) {
        // Update mode - kirim tanpa company_code karena tidak boleh diubah
        const { company_code, ...updatePayload } = form;
        await apiFetch("/api/v1/company", {
          method: "PUT",
          body: JSON.stringify(updatePayload),
        });
      } else {
        // Create mode - data pertama kali
        await apiFetch("/api/v1/company", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      setIsEditing(false);
      fetchCompany();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Profil Perusahaan
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Kelola data identitas dan informasi resmi perusahaan
              </p>
            </div>
            {company && !isEditing && (
              <button
                onClick={openEditForm}
                style={{ backgroundColor: "rgb(0, 103, 71)" }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white font-bold text-sm shadow-md shadow-emerald-900/10"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profil</span>
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
              <div className="h-6 bg-slate-100 rounded-xl animate-pulse w-1/3" />
              <div className="h-4 bg-slate-100 rounded-xl animate-pulse w-1/2" />
              <div className="h-4 bg-slate-100 rounded-xl animate-pulse w-2/3" />
            </div>
          ) : !company && !isEditing ? (
            // Empty State - belum ada data sama sekali
            <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center text-center gap-4">
              <div
                style={{ backgroundColor: "rgba(0, 103, 71, 0.08)" }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
              >
                <Building2
                  style={{ color: "rgb(0, 103, 71)" }}
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Belum Ada Data Perusahaan
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Silakan lengkapi profil perusahaan untuk memulai
                </p>
              </div>
              <button
                onClick={openCreateForm}
                style={{ backgroundColor: "rgb(0, 103, 71)" }}
                className="mt-2 px-5 py-2.5 rounded-2xl text-white font-bold text-sm shadow-md shadow-emerald-900/10"
              >
                Setup Profil Perusahaan
              </button>
            </div>
          ) : company && !isEditing ? (
            // Display Mode - data sudah ada
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-start gap-6">
                <div
                  style={{ backgroundColor: "rgba(0, 103, 71, 0.08)" }}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                >
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Building2
                      style={{ color: "rgb(0, 103, 71)" }}
                      className="w-9 h-9"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    style={{
                      backgroundColor: "rgba(0, 103, 71, 0.08)",
                      borderColor: "rgba(0, 103, 71, 0.2)",
                      color: "rgb(0, 103, 71)",
                    }}
                    className="inline-block px-3 py-1 rounded-xl border font-mono text-xs font-bold mb-2"
                  >
                    {company.company_code}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {company.company_name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {company.legal_name}
                  </p>
                  {company.tax_id && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      NPWP: {company.tax_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    {[
                      company.address_line1,
                      company.address_line2,
                      company.city,
                      company.province,
                      company.postal_code,
                      company.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || (
                      <span className="text-slate-400">Belum diisi</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    {company.phone || (
                      <span className="text-slate-400">Belum diisi</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    {company.email || (
                      <span className="text-slate-400">Belum diisi</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    {company.website || (
                      <span className="text-slate-400">Belum diisi</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Form Mode - create atau edit
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Kode Perusahaan
                  </label>
                  <input
                    name="company_code"
                    value={form.company_code}
                    onChange={handleChange}
                    disabled={!!company}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Nama Perusahaan *
                  </label>
                  <input
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Nama Legal (PT/CV) *
                  </label>
                  <input
                    name="legal_name"
                    value={form.legal_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    NPWP
                  </label>
                  <input
                    name="tax_id"
                    value={form.tax_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Alamat Baris 1 *
                  </label>
                  <input
                    name="address_line1"
                    value={form.address_line1}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Alamat Baris 2
                  </label>
                  <input
                    name="address_line2"
                    value={form.address_line2}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Kota *
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Provinsi *
                  </label>
                  <input
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Kode Pos *
                  </label>
                  <input
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Negara *
                  </label>
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Telepon *
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Website
                  </label>
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-slate-500 hover:text-slate-900 font-semibold text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Batal</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ backgroundColor: "rgb(0, 103, 71)" }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-sm shadow-md shadow-emerald-900/10 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Menyimpan..." : "Simpan"}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
