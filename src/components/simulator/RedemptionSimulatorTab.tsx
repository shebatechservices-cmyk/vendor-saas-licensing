"use client";

import React from "react";
import { KeyRound, RefreshCw } from "lucide-react";

interface RedemptionSimulatorTabProps {
  currentClient: any;
  redeemCode: string;
  setRedeemCode: (val: string) => void;
  availableCodes: any[];
  redeemLoading: boolean;
  onSendRedemption: () => void;
}

export function RedemptionSimulatorTab({
  currentClient,
  redeemCode,
  setRedeemCode,
  availableCodes,
  redeemLoading,
  onSendRedemption,
}: RedemptionSimulatorTabProps) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
        <div>
          <span className="text-slate-500">Target Endpoint: </span>
          <span className="text-emerald-300 font-bold">POST /api/vendor/redeem</span>
        </div>
        <div>
          <span className="text-slate-500">Client Code: </span>
          <span className="text-emerald-400">{currentClient?.clientCode}</span>
        </div>
      </div>

      <div>
        <label className="block text-slate-400 font-semibold mb-1">
          License Code to Redeem
        </label>
        <input
          type="text"
          placeholder="e.g. SAAS-7K9P-4M2X-8W1Q"
          value={redeemCode}
          onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm tracking-wider"
        />
      </div>

      {availableCodes.length > 0 && (
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
            Quick Pick Available Code from Vault:
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {availableCodes.slice(0, 6).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setRedeemCode(c.code)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono border cursor-pointer ${
                  redeemCode === c.code
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {c.code} ({c.category.split("_")[0]})
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSendRedemption}
        disabled={redeemLoading || !redeemCode}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {redeemLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <KeyRound className="w-4 h-4" />
        )}
        Simulate Remote Code Redemption
      </button>
    </div>
  );
}
