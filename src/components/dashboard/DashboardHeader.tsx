"use client";

import React from "react";
import Link from "next/link";
import { RefreshCw, PlusCircle, Zap } from "lucide-react";

interface DashboardHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ isRefreshing, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <span>Vendor SaaS Master Controller</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Live Sync Active
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enterprise management hub for Client Subscriptions, Killswitch Directives, Code Pre-generation & Accounting.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          Refresh Telemetry
        </button>
        <Link
          href="/codes"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Generate Codes
        </Link>
        <Link
          href="/simulator"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          Integration Simulator
        </Link>
      </div>
    </div>
  );
}
