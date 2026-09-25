"use client";

import React from "react";
import { Globe, Plus, Trash2, RefreshCw, ShieldCheck } from "lucide-react";

interface IpWhitelistTabProps {
  clientIp: string;
  ipList: string[];
  newIpInput: string;
  setNewIpInput: (val: string) => void;
  ipWhitelistEnabled: boolean;
  setIpWhitelistEnabled: (val: boolean) => void;
  savingIp: boolean;
  onAddIp: () => void;
  onRemoveIp: (ip: string) => void;
  onAddCurrentIp: () => void;
  onSaveIpWhitelist: () => void;
}

export function IpWhitelistTab({
  clientIp,
  ipList,
  newIpInput,
  setNewIpInput,
  ipWhitelistEnabled,
  setIpWhitelistEnabled,
  savingIp,
  onAddIp,
  onRemoveIp,
  onAddCurrentIp,
  onSaveIpWhitelist,
}: IpWhitelistTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Layer 3: Network IP Whitelist Enforcement
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            When enabled, only connections originating from allowed IP addresses can authenticate.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={ipWhitelistEnabled}
            onChange={(e) => setIpWhitelistEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
        </label>
      </div>

      <div className="bg-slate-950/40 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-slate-400">Current Client IP:</span>
          <code className="font-mono text-cyan-300 font-bold">{clientIp || "127.0.0.1"}</code>
        </div>

        {!ipList.includes(clientIp || "127.0.0.1") && (
          <button
            type="button"
            onClick={onAddCurrentIp}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] transition-all cursor-pointer"
          >
            + Add My IP to Whitelist
          </button>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-300">
          Allowed IP Addresses & Subnets (IPv4, IPv6, CIDR):
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newIpInput}
            onChange={(e) => setNewIpInput(e.target.value)}
            placeholder="e.g. 192.168.1.100, 10.0.0.0/24, 203.0.113.4"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={onAddIp}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add IP
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-slate-400">Active Authorized IP Addresses ({ipList.length})</div>
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {ipList.map((ip, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="text-slate-200">{ip}</span>
                {ip === (clientIp || "127.0.0.1") && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-sans">
                    (Current Session)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveIp(ip)}
                className="text-slate-500 hover:text-rose-400 p-1 transition-all cursor-pointer"
                title="Remove IP"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onSaveIpWhitelist}
          disabled={savingIp}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {savingIp ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Saving Rules...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Save IP Whitelist Configuration
            </>
          )}
        </button>
      </div>
    </div>
  );
}
