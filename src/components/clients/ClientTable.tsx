"use client";

import React from "react";
import { Globe, Lock, Unlock, RefreshCw, Eye } from "lucide-react";
import { ClientStatusBadge } from "@/components/ClientStatusBadge";

interface ClientTableProps {
  clients: any[];
  togglingId: string | null;
  onToggleStatus: (clientId: string, currentStatus: string) => void;
  onSelectClient: (client: any) => void;
}

export function ClientTable({
  clients,
  togglingId,
  onToggleStatus,
  onSelectClient,
}: ClientTableProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-4 px-6">Client Info</th>
              <th className="py-4 px-6">Credentials / Domain</th>
              <th className="py-4 px-6">License Expiry</th>
              <th className="py-4 px-6">Student Quota</th>
              <th className="py-4 px-6">Financial Balance</th>
              <th className="py-4 px-6">Live Connectivity</th>
              <th className="py-4 px-6 text-right">Killswitch & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {clients.map((c) => {
              const isOnline = c.isOnline;
              const isBlocked = c.status === "BLOCKED" || c.status === "SUSPENDED";

              return (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-white text-sm">{c.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{c.contactPerson || "Admin"}</span>
                      {c.phone && <span>• {c.phone}</span>}
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-mono text-emerald-400 font-bold">{c.clientCode}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Globe className="w-3 h-3 text-slate-500" />
                      <span>{c.domain || "Local / Dynamic"}</span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    {c.isLifetime ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Lifetime
                      </span>
                    ) : c.licenseExpiresAt ? (
                      <div className="text-slate-300">
                        {new Date(c.licenseExpiresAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-slate-500">Not set</span>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-white">{c.quotas?.usedStudents || 0}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-purple-400">{c.studentQuota}</span>
                      <span className="text-[10px] text-slate-500 font-normal uppercase">slots</span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold">
                      {c.currentDueBdt > 0 ? (
                        <span className="text-rose-400">{c.currentDueBdt.toLocaleString()} BDT Due</span>
                      ) : (
                        <span className="text-emerald-400">Clear (0 BDT)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Billed: {(c.totalBilledBdt || 0).toLocaleString()} BDT
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-600"
                        }`}
                      />
                      <span className={isOnline ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                        {c.lastHeartbeatAt
                          ? new Date(c.lastHeartbeatAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Offline"}
                      </span>
                    </div>
                    <div className="mt-1">
                      <ClientStatusBadge status={c.status} size="sm" />
                    </div>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onToggleStatus(c.id, c.status)}
                        disabled={togglingId === c.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          !isBlocked
                            ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30"
                            : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {togglingId === c.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : !isBlocked ? (
                          <>
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span>Block</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            <span>Unblock</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onSelectClient(c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                        title="Inspect Client & API Credentials"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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
