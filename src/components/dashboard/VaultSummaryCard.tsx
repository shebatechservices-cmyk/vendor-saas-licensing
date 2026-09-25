"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, PlusCircle } from "lucide-react";

interface VaultSummaryCardProps {
  stats: any;
}

export function VaultSummaryCard({ stats }: VaultSummaryCardProps) {
  return (
    <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Code Pre-Generation Vault</h3>
          </div>
          <Link href="/codes" className="text-xs text-emerald-400 font-bold hover:underline">
            View Vault
          </Link>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Available pre-generated keys ready for assignment or remote redemption.
        </p>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">App Licenses (1-12 Yr / Lifetime)</div>
              <div className="text-[11px] text-slate-400">Core SaaS App activations</div>
            </div>
            <span className="text-sm font-black text-emerald-400">
              {stats?.codes?.availableByCategory?.find((c: any) => c.category === "APP_LICENSE")?._count ?? 0} Available
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Student Quota Upgrades (+100)</div>
              <div className="text-[11px] text-slate-400">1000 Credits = 2000 BDT</div>
            </div>
            <span className="text-sm font-black text-purple-400">
              {stats?.codes?.availableByCategory?.find((c: any) => c.category === "STUDENT_QUOTA_UPGRADE")?._count ?? 0} Available
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Cloud Hosting & Domain Keys</div>
              <div className="text-[11px] text-slate-400">Server & Registry renewals</div>
            </div>
            <span className="text-sm font-black text-cyan-400">
              {(stats?.codes?.availableByCategory?.find((c: any) => c.category === "HOSTING_RENEWAL")?._count ?? 0) +
                (stats?.codes?.availableByCategory?.find((c: any) => c.category === "DOMAIN_RENEWAL")?._count ?? 0)}{" "}
              Available
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800">
        <Link
          href="/codes"
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          Pre-Generate New Code Batch
        </Link>
      </div>
    </div>
  );
}
