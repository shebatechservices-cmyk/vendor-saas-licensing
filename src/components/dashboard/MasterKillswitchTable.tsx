"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  ArrowUpRight,
  Sparkles,
  CalendarPlus,
  Ban,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { ClientStatusBadge } from "@/components/ClientStatusBadge";
import { GracePeriodBadge } from "@/components/GracePeriodBadge";

interface MasterKillswitchTableProps {
  clients: any[];
  togglingId: string | null;
  onToggleStatus: (clientId: string, currentStatus: string) => void;
  onExtendTrial: (client: any) => void;
  onRenew: (client: any) => void;
  onForceBlock: (client: any) => void;
  onSelectClient: (client: any) => void;
}

export function MasterKillswitchTable({
  clients,
  togglingId,
  onToggleStatus,
  onExtendTrial,
  onRenew,
  onForceBlock,
  onSelectClient,
}: MasterKillswitchTableProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Master Control: Client Subscriptions & Killswitch</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Activate, block, or suspend any client application in real-time. Blocked apps are instantly locked on next heartbeat.
          </p>
        </div>

        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition self-start sm:self-auto"
        >
          <span>Manage All Clients</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-6">Client Application</th>
              <th className="py-3.5 px-6">Domain / Endpoint</th>
              <th className="py-3.5 px-6">License Expiry</th>
              <th className="py-3.5 px-6">Student Quota</th>
              <th className="py-3.5 px-6">Live Connectivity & Grace</th>
              <th className="py-3.5 px-6 text-right">Quick Actions & Killswitch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {clients.map((c) => {
              const isBlocked = c.status === "BLOCKED" || c.status === "SUSPENDED";
              const isTrial = c.isTrial;
              const isExpiringSoon = c.isExpiringSoon;
              const isExpired = !c.isLifetime && c.licenseExpiresAt && new Date(c.licenseExpiresAt) < new Date();

              return (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{c.name}</span>
                      {isTrial && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Trial
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{c.clientCode}</div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="text-slate-200 font-mono">{c.domain || "N/A"}</div>
                    <div className="text-[11px] text-slate-500">{c.appType}</div>
                  </td>

                  <td className="py-4 px-6">
                    {c.isLifetime ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Lifetime License
                      </span>
                    ) : c.licenseExpiresAt ? (
                      <div>
                        <div className="text-slate-300 font-medium">
                          {new Date(c.licenseExpiresAt).toLocaleDateString()}
                        </div>
                        {isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 mt-0.5 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Expiring Soon (1-3d)
                          </span>
                        ) : isExpired ? (
                          <span className="text-[10px] font-bold text-rose-400 mt-0.5 block">
                            Expired
                          </span>
                        ) : (
                          <div className="text-[10px] text-slate-500">
                            {Math.ceil((new Date(c.licenseExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">Not configured</span>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-200">{c.quotas?.usedStudents || 0}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-purple-400">{c.studentQuota}</span>
                      <span className="text-[10px] text-slate-500 font-normal uppercase">slots</span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <GracePeriodBadge
                      isOnline={c.isOnline}
                      inGracePeriod={c.inGracePeriod}
                      isCriticalOffline={c.isCriticalOffline}
                      graceRemainingHours={c.graceRemainingHours}
                      lastHeartbeatAt={c.lastHeartbeatAt}
                      size="sm"
                    />
                    <div className="mt-1.5">
                      <ClientStatusBadge status={c.status} size="sm" />
                    </div>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onExtendTrial(c)}
                        disabled={togglingId === c.id}
                        className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition cursor-pointer disabled:opacity-50"
                        title="Extend Trial (+7 Days)"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRenew(c)}
                        disabled={togglingId === c.id}
                        className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
                        title="Renew License (+1 Year)"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>

                      {!isBlocked && (
                        <button
                          type="button"
                          onClick={() => onForceBlock(c)}
                          disabled={togglingId === c.id}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition cursor-pointer disabled:opacity-50"
                          title="Force Block (Master Killswitch)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onToggleStatus(c.id, c.status)}
                        disabled={togglingId === c.id}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          !isBlocked
                            ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30"
                            : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {togglingId === c.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : !isBlocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-rose-400" />
                            <span className="hidden sm:inline">Block</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Unblock</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onSelectClient(c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                        title="Inspect Credentials & Subscriptions"
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
