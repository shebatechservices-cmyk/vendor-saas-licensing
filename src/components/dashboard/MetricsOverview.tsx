"use client";

import React from "react";
import {
  Users,
  Activity,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  DollarSign,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";

interface MetricsOverviewProps {
  stats: any;
}

export function MetricsOverview({ stats }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Feature 1: Client Subscriptions with Active Trials & Expiring Soon Metrics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Subscriptions</span>
            <div className="w-9 h-9 rounded-xl border flex items-center justify-center bg-blue-500/10 border-blue-500/20 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats?.clients?.total ?? 0}</span>
            <span className="text-xs text-slate-400">Instances Deployed</span>
          </div>

          {/* Trial & Expiring Soon Badges */}
          <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Active Trials</span>
              <span className="text-base font-black text-cyan-300 mt-0.5">{stats?.clients?.activeTrials ?? 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Expiring (1-3d)</span>
              <span className="text-base font-black text-amber-300 mt-0.5">{stats?.clients?.expiringSoon ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            {stats?.clients?.active ?? 0} Active
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            {stats?.clients?.blocked ?? 0} Blocked
          </span>
        </div>
      </div>

      {/* Feature 2: Live Connectivity with Grace Period & Critical Offline Monitoring */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Connectivity</span>
            <div className="w-9 h-9 rounded-xl border flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{stats?.clients?.online ?? 0}</span>
            <span className="text-xs text-slate-400">Heartbeats Live (&lt;10m)</span>
          </div>

          {/* Grace Period Sub-metrics */}
          <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Grace Period</span>
              <span className="text-base font-black text-amber-300 mt-0.5">{stats?.clients?.inGracePeriod ?? 0} (&le;48h)</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Offline</span>
              <span className="text-base font-black text-slate-300 mt-0.5">{stats?.clients?.criticalOffline ?? 0} (&gt;48h)</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Ping Cycle</span>
          <span className="text-emerald-400 font-mono font-semibold">Every 2-5 min</span>
        </div>
      </div>

      <StatCard
        title="Student Quota Capacity"
        value={stats?.students?.totalSlots?.toLocaleString() ?? 0}
        subtitle="Total Slots Sold"
        icon={GraduationCap}
        colorScheme="purple"
        footerLeft={<span className="text-slate-400">Active Enrolled</span>}
        footerRight={
          <span className="text-purple-400 font-semibold">
            {stats?.students?.activeEnrolled?.toLocaleString() ?? 0}
          </span>
        }
      />

      <StatCard
        title="Financial Ledger"
        value={`${(stats?.finance?.totalBilledBdt ?? 0).toLocaleString()} BDT`}
        subtitle="Total Billed"
        icon={DollarSign}
        colorScheme="amber"
        footerLeft={
          <span className="text-emerald-400 font-medium">
            {(stats?.finance?.totalPaidBdt ?? 0).toLocaleString()} BDT Paid
          </span>
        }
        footerRight={
          <span className="text-rose-400 font-bold">
            {(stats?.finance?.totalOutstandingDuesBdt ?? 0).toLocaleString()} BDT Due
          </span>
        }
      />
    </div>
  );
}
