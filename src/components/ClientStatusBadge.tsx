"use client";

import React from "react";
import { CheckCircle2, ShieldAlert, AlertTriangle, Clock } from "lucide-react";

interface ClientStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function ClientStatusBadge({ status, size = "md" }: ClientStatusBadgeProps) {
  const isSmall = size === "sm";

  if (status === "ACTIVE") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <CheckCircle2 className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>Active</span>
      </span>
    );
  }

  if (status === "BLOCKED" || status === "SUSPENDED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold border bg-rose-500/10 text-rose-400 border-rose-500/30 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <ShieldAlert className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>{status === "BLOCKED" ? "Blocked" : "Suspended"}</span>
      </span>
    );
  }

  if (status === "EXPIRED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold border bg-amber-500/10 text-amber-400 border-amber-500/30 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <AlertTriangle className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>Expired</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border bg-slate-800 text-slate-400 border-slate-700 ${
        isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Clock className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{status || "Pending"}</span>
    </span>
  );
}
