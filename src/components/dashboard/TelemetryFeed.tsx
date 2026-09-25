"use client";

import React from "react";
import { Server, Activity } from "lucide-react";

interface TelemetryFeedProps {
  heartbeats: any[];
}

export function TelemetryFeed({ heartbeats }: TelemetryFeedProps) {
  return (
    <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">Live Heartbeat Telemetry Feed</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Real-time Webhook Pings</span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
        {heartbeats && heartbeats.length > 0 ? (
          heartbeats.map((hb: any) => {
            const isOnline = hb.isOnlineWithin10m ?? true;
            const displayName = hb.clientName || hb.client?.name || "Client Application";
            const displayCode = hb.clientCode || hb.client?.clientCode;

            return (
              <div
                key={hb.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                  }`}>
                    <Activity className={`w-4 h-4 ${isOnline ? "animate-pulse" : ""}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{displayName}</span>
                      {displayCode && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {displayCode}
                        </span>
                      )}
                      {isOnline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>IP: {hb.ipAddress || "127.0.0.1"}</span>
                      <span>•</span>
                      <span>Ver: {hb.appVersion || "v2.4.x"}</span>
                      {hb.activeStudentsCount && (
                        <>
                          <span>•</span>
                          <span className="text-purple-300 font-semibold">
                            {hb.activeStudentsCount} Active Students
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(hb.createdAt || hb.last_sync).toLocaleTimeString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOnline && (hb.statusReported === "OPERATIONAL" || hb.statusReported === "OK" || hb.live_status === "ONLINE")
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : hb.statusReported === "WARNING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {hb.live_status || hb.statusReported}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-500 text-xs">
            No heartbeats recorded yet. Use the Simulator to simulate client pings.
          </div>
        )}
      </div>
    </div>
  );
}
