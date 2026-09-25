"use client";

import React from "react";
import { Activity, AlertTriangle, WifiOff, Clock } from "lucide-react";

interface GracePeriodBadgeProps {
  isOnline: boolean;
  inGracePeriod?: boolean;
  isCriticalOffline?: boolean;
  graceRemainingHours?: number;
  lastHeartbeatAt?: string | Date | null;
  size?: "sm" | "md";
}

export function GracePeriodBadge({
  isOnline,
  inGracePeriod,
  isCriticalOffline,
  graceRemainingHours = 0,
  lastHeartbeatAt,
  size = "md",
}: GracePeriodBadgeProps) {
  const isSmall = size === "sm";

  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${
            isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          }`}
        >
          <Activity className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          <span>Online</span>
        </span>
      </div>
    );
  }

  if (inGracePeriod) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10 ${
            isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          }`}
          title={`Client is offline but within the 48-hour grace period. Access will be blocked if offline expires.`}
        >
          <AlertTriangle className={isSmall ? "w-3 h-3 text-amber-400" : "w-3.5 h-3.5 text-amber-400"} />
          <span>Grace Period ({graceRemainingHours}h left)</span>
        </span>
      </div>
    );
  }

  // Critical offline (>48h or never)
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium bg-slate-800/80 text-slate-400 border border-slate-700/80 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <WifiOff className={isSmall ? "w-3 h-3 text-slate-500" : "w-3.5 h-3.5 text-slate-500"} />
        <span>{lastHeartbeatAt ? "Critical Offline (>48h)" : "Never Connected"}</span>
      </span>
    </div>
  );
}
