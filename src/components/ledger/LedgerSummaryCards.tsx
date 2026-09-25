"use client";

import React from "react";
import { TrendingUp, ArrowDownLeft, TrendingDown } from "lucide-react";

interface LedgerSummaryCardsProps {
  summary: {
    totalBilledBdt: number;
    totalPaidBdt: number;
    totalOutstandingDuesBdt: number;
  };
}

export function LedgerSummaryCards({ summary }: LedgerSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Billed Gross
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {summary.totalBilledBdt.toLocaleString()} BDT
          </div>
          <span className="text-[11px] text-slate-500">All client software & quota invoices</span>
        </div>
        <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Collected / Paid
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {summary.totalPaidBdt.toLocaleString()} BDT
          </div>
          <span className="text-[11px] text-emerald-500/70">Verified received collections</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ArrowDownLeft className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Outstanding Net Dues
          </span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {summary.totalOutstandingDuesBdt.toLocaleString()} BDT
          </div>
          <span className="text-[11px] text-rose-500/70">Unpaid balances owed by clients</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
