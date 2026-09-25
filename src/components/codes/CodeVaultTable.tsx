"use client";

import React from "react";
import { Filter, Search, Copy, Check, GraduationCap } from "lucide-react";

interface CodeVaultTableProps {
  codes: any[];
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  copiedCode: string | null;
  onCopy: (code: string) => void;
}

export function CodeVaultTable({
  codes,
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  copiedCode,
  onCopy,
}: CodeVaultTableProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {["ALL", "AVAILABLE", "ASSIGNED", "USED", "REVOKED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterStatus === st
                  ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code, batch, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">License Code</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Validity / Benefit</th>
                <th className="py-4 px-6">Price (BDT)</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Batch / Assignment</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {codes.map((c) => {
                const isAvailable = c.status === "AVAILABLE";
                const isUsed = c.status === "USED";

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-emerald-400 font-black text-sm bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {c.code}
                        </code>
                        <button
                          onClick={() => onCopy(c.code)}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedCode === c.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-300">{c.category.replace(/_/g, " ")}</span>
                    </td>

                    <td className="py-4 px-6">
                      {c.category === "STUDENT_QUOTA_UPGRADE" ? (
                        <span className="inline-flex items-center gap-1 font-bold text-purple-300">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                          +{c.studentQuotaAdded || 100} Students ({c.quotaCredits} Credits)
                        </span>
                      ) : c.isLifetime ? (
                        <span className="font-bold text-purple-400">Lifetime Unlimited</span>
                      ) : (
                        <span className="text-slate-300">{c.validityYears} Year(s)</span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-bold text-amber-400">
                      {c.priceBdt.toLocaleString()} BDT
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isAvailable
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : isUsed
                            ? "bg-slate-800 text-slate-400 border-slate-700"
                            : c.status === "ASSIGNED"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-400">
                      {c.redeemedClient ? (
                        <div>
                          <div className="text-slate-200 font-bold">Redeemed by: {c.redeemedClient.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(c.redeemedAt).toLocaleString()}
                          </div>
                        </div>
                      ) : c.assignedClient ? (
                        <div className="text-blue-300 font-semibold">
                          Assigned to: {c.assignedClient.name}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">
                          {c.batch?.batchNumber || "Standalone"}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onCopy(c.code)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                      >
                        {copiedCode === c.code ? "Copied!" : "Copy Key"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
