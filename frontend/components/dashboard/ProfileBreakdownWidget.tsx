"use client";

import { ProfileBreakdownItem } from "@/types/dashboard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: ProfileBreakdownItem[];
  loading: boolean;
}

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#0ea5e9"];

export default function ProfileBreakdownWidget({ data = [], loading }: Props) {
  if (loading) {
    return <div className="h-72 bg-slate-100 animate-pulse rounded-2xl p-4" />;
  }

  const totalRecords = data.reduce((acc, curr) => acc + curr.total_records, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h3 className="text-base font-bold text-slate-900">Breakdown Profil Rekon</h3>
        <p className="text-xs text-slate-500 mb-2">Persentase volume transaksi per kanal</p>

        {/* Recharts Donut Container */}
        <div className="h-48 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="total_records"
                nameKey="profile_name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value.toLocaleString("id-ID")} Trx`, "Total"]}
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-extrabold text-slate-900">{totalRecords.toLocaleString("id-ID")}</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Trx</span>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-2 space-y-2">
          {data.map((item, index) => (
            <div key={item.profile_id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-semibold text-slate-700">{item.profile_name}</span>
              </div>
              <span className="font-bold text-slate-900">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}