"use client";

import React from "react";
import { BookOpen } from "lucide-react";

interface ClientQuotaTableProps {
  clients: any[];
}

export function ClientQuotaTable({ clients }: ClientQuotaTableProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white text-base">Connected Madrasa Quota Capacity & Usage</h3>
        </div>
        <span className="text-xs text-slate-400">Live Telemetry Synchronized</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-4 px-6">Madrasa / School</th>
              <th className="py-4 px-6">Base Limit</th>
              <th className="py-4 px-6">Extra Upgrades</th>
              <th className="py-4 px-6">Total Limit</th>
              <th className="py-4 px-6">Enrolled Students</th>
              <th className="py-4 px-6">Capacity Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {clients.map((c) => {
              const used = c.quotas?.usedStudents || 0;
              const total = c.studentQuota || 200;
              const percent = Math.min(100, Math.round((used / total) * 100));

              return (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{c.clientCode}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-300 font-mono">
                    {c.quotas?.baseStudents || 200}
                  </td>
                  <td className="py-4 px-6 font-mono text-purple-400 font-bold">
                    +{c.quotas?.extraStudents || 0}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-white">{total}</td>
                  <td className="py-4 px-6 font-mono font-bold text-cyan-300">{used}</td>
                  <td className="py-4 px-6">
                    <div className="w-full max-w-[160px] space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">{percent}% Used</span>
                        <span className="text-slate-400">{total - used} Free</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent > 90
                              ? "bg-rose-500"
                              : percent > 75
                              ? "bg-amber-500"
                              : "bg-purple-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
