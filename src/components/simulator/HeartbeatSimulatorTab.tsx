"use client";

import React from "react";
import { Play, RefreshCw } from "lucide-react";

interface HeartbeatSimulatorTabProps {
  currentClient: any;
  hbStudents: number;
  setHbStudents: (val: number) => void;
  hbAppVersion: string;
  setHbAppVersion: (val: string) => void;
  hbLoading: boolean;
  onSendHeartbeat: () => void;
}

export function HeartbeatSimulatorTab({
  currentClient,
  hbStudents,
  setHbStudents,
  hbAppVersion,
  setHbAppVersion,
  hbLoading,
  onSendHeartbeat,
}: HeartbeatSimulatorTabProps) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
        <div>
          <span className="text-slate-500">Target Endpoint: </span>
          <span className="text-cyan-300 font-bold">POST /api/vendor/heartbeat</span>
        </div>
        <div>
          <span className="text-slate-500">Client Code: </span>
          <span className="text-emerald-400">{currentClient?.clientCode}</span>
        </div>
        <div>
          <span className="text-slate-500">Secret Key: </span>
          <span className="text-amber-400">{currentClient?.secretKey}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Active Students Count</label>
          <input
            type="number"
            value={hbStudents}
            onChange={(e) => setHbStudents(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Client App Version</label>
          <input
            type="text"
            value={hbAppVersion}
            onChange={(e) => setHbAppVersion(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
          />
        </div>
      </div>

      <button
        onClick={onSendHeartbeat}
        disabled={hbLoading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
      >
        {hbLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        Simulate Periodic Heartbeat Ping
      </button>
    </div>
  );
}
