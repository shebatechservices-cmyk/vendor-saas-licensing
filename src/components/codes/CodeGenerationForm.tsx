"use client";

import React from "react";
import { Sparkles, GraduationCap, RefreshCw, PlusCircle } from "lucide-react";

interface CodeGenerationFormProps {
  category: "APP_LICENSE" | "HOSTING_RENEWAL" | "DOMAIN_RENEWAL" | "STUDENT_QUOTA_UPGRADE";
  setCategory: (val: any) => void;
  validityYears: number;
  setValidityYears: (val: number) => void;
  isLifetime: boolean;
  setIsLifetime: (val: boolean) => void;
  quotaCredits: number;
  setQuotaCredits: (val: number) => void;
  quantity: number;
  setQuantity: (val: number) => void;
  batchName: string;
  setBatchName: (val: string) => void;
  assignedClientId: string;
  setAssignedClientId: (val: string) => void;
  clients: any[];
  generating: boolean;
  quotaCalc: any;
  unitPrice: number;
  totalBatchPrice: number;
  onGenerate: (e: React.FormEvent) => void;
}

export function CodeGenerationForm({
  category,
  setCategory,
  validityYears,
  setValidityYears,
  isLifetime,
  setIsLifetime,
  quotaCredits,
  setQuotaCredits,
  quantity,
  setQuantity,
  batchName,
  setBatchName,
  assignedClientId,
  setAssignedClientId,
  clients,
  generating,
  quotaCalc,
  unitPrice,
  totalBatchPrice,
  onGenerate,
}: CodeGenerationFormProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h2 className="text-base font-bold text-white">Batch Pre-Generation Configuration</h2>
      </div>

      <form onSubmit={onGenerate} className="space-y-6">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select License / Service Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: "APP_LICENSE", label: "App License", desc: "Core SaaS Software Validity" },
              { id: "STUDENT_QUOTA_UPGRADE", label: "Student Quota Upgrade", desc: "1000 Credits = 2000 BDT = 100 Students" },
              { id: "HOSTING_RENEWAL", label: "Hosting Renewal", desc: "Cloud Server Hosting" },
              { id: "DOMAIN_RENEWAL", label: "Domain Renewal", desc: ".edu.bd / .com Registry" },
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  category === cat.id
                    ? "bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-xs text-white">{cat.label}</div>
                <div className="text-[11px] text-slate-400 mt-1">{cat.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Options: Validity or Quota */}
        {category === "STUDENT_QUOTA_UPGRADE" ? (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              Madrasa / School Quota Formula: 1000 Credits = 2000 BDT (10 Credits = 1 Student)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Credits Amount</label>
                <select
                  value={quotaCredits}
                  onChange={(e) => setQuotaCredits(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value={500}>500 Credits (+50 Students = 1,000 BDT)</option>
                  <option value={1000}>1,000 Credits (+100 Students = 2,000 BDT)</option>
                  <option value={2000}>2,000 Credits (+200 Students = 4,000 BDT)</option>
                  <option value={5000}>5,000 Credits (+500 Students = 10,000 BDT)</option>
                  <option value={10000}>10,000 Credits (+1000 Students = 20,000 BDT)</option>
                </select>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[11px] text-slate-400">Student Slots Added</span>
                <span className="text-lg font-black text-purple-300">+{quotaCalc.students} Students</span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[11px] text-slate-400">Unit Price (BDT)</span>
                <span className="text-lg font-black text-amber-400">{quotaCalc.priceFormatted}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">
                License Validity Duration
              </label>
              <select
                disabled={isLifetime}
                value={validityYears}
                onChange={(e) => setValidityYears(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs disabled:opacity-50"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((y) => (
                  <option key={y} value={y}>
                    {y} Year(s) Validity
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="lifetimeCheck"
                checked={isLifetime}
                onChange={(e) => setIsLifetime(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 cursor-pointer"
              />
              <label htmlFor="lifetimeCheck" className="text-xs font-bold text-white cursor-pointer">
                Lifetime Unlimited Validity
              </label>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Unit Standard Price</span>
              <span className="text-base font-black text-amber-400">
                {unitPrice.toLocaleString()} BDT
              </span>
            </div>
          </div>
        )}

        {/* Batch Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">
              Batch Quantity (Keys to generate)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Batch Label / Name</label>
            <input
              type="text"
              placeholder="e.g. Q1 2026 Madrasa Expansion"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">
              Lock / Pre-Assign to Client (Optional)
            </label>
            <select
              value={assignedClientId}
              onChange={(e) => setAssignedClientId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            >
              <option value="">Unassigned (Available for any client)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clientCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing Summary & Submit */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">
              Total Batch Valuation:{" "}
              <strong className="text-white text-sm font-black">{totalBatchPrice.toLocaleString()} BDT</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              Format: <code className="text-emerald-400 font-mono">SAAS-XXXX-XXXX-XXXX</code>
            </span>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Keys...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Generate {quantity} Secure Code(s)
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
