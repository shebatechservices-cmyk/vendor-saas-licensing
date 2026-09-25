"use client";

import React from "react";
import { Filter, Building } from "lucide-react";

interface LedgerTableProps {
  transactions: any[];
  clients: any[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
}

export function LedgerTable({
  transactions,
  clients,
  selectedClientId,
  setSelectedClientId,
  selectedType,
  setSelectedType,
}: LedgerTableProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="ALL">All Clients Statement</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clientCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            {["ALL", "BILLING", "PAYMENT", "REDEMPTION", "ADJUSTMENT"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedType === t
                    ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Statement Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Date / Reference</th>
                <th className="py-4 px-6">Client Application</th>
                <th className="py-4 px-6">Transaction Detail</th>
                <th className="py-4 px-6">Method / Performed By</th>
                <th className="py-4 px-6 text-right">Debit (Billed)</th>
                <th className="py-4 px-6 text-right">Credit (Paid)</th>
                <th className="py-4 px-6 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {transactions.map((tx) => {
                const isPayment = tx.transactionType === "PAYMENT" || tx.creditAmount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-200">{tx.client?.name}</div>
                      <div className="text-[10px] font-mono text-emerald-400">
                        {tx.client?.clientCode}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-slate-300 font-semibold">{tx.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isPayment
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                        {tx.receiptNumber && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ref: {tx.receiptNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-slate-300">{tx.paymentMethod || "System Billing"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.performedBy || "VENDOR_ADMIN"}</div>
                    </td>

                    <td className="py-4 px-6 text-right font-bold text-rose-400">
                      {tx.debitAmount > 0 ? `${tx.debitAmount.toLocaleString()} BDT` : "-"}
                    </td>

                    <td className="py-4 px-6 text-right font-bold text-emerald-400">
                      {tx.creditAmount > 0 ? `${tx.creditAmount.toLocaleString()} BDT` : "-"}
                    </td>

                    <td className="py-4 px-6 text-right font-black font-mono">
                      <span
                        className={
                          tx.runningBalanceBdt > 0
                            ? "text-rose-400"
                            : tx.runningBalanceBdt < 0
                            ? "text-emerald-400"
                            : "text-slate-400"
                        }
                      >
                        {tx.runningBalanceBdt.toLocaleString()} BDT
                      </span>
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
