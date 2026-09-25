"use client";

import React from "react";
import { Terminal } from "lucide-react";

interface SimulatorHeaderProps {
  clients: any[];
  selectedClientId: string;
  onSelectClient: (id: string) => void;
}

export function SimulatorHeader({
  clients,
  selectedClientId,
  onSelectClient,
}: SimulatorHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-800/40 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-7 h-7 text-cyan-400" />
            <h1 className="text-2xl font-black text-white">Client SDK & Live Integration Simulator</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Test remote heartbeat pings, master killswitch directives, and remote code redemptions interactively.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Selected Client App:</span>
          <select
            value={selectedClientId}
            onChange={(e) => onSelectClient(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-950 border border-cyan-800/60 rounded-xl text-xs font-bold text-cyan-300"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.clientCode}) - [{c.status}]
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
