"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert, AlertTriangle, X, CheckCircle2, Shield, RefreshCw } from "lucide-react";

export interface SecurityAlertItem {
  id: string;
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
  title: string;
  description: string;
  ipAddress?: string | null;
  clientCode?: string | null;
  resolved: boolean;
  createdAt: string;
}

interface SecurityAlertsBannerProps {
  initialAlerts?: SecurityAlertItem[];
  onAlertDismissed?: () => void;
}

export function SecurityAlertsBanner({ initialAlerts = [], onAlertDismissed }: SecurityAlertsBannerProps) {
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>(initialAlerts);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialAlerts) {
      setAlerts(initialAlerts.filter((a) => !a.resolved));
    }
  }, [initialAlerts]);

  const handleDismiss = async (alertId: string) => {
    try {
      setDismissingId(alertId);
      // Optimistic update
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));

      const res = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: "POST",
      });
      if (!res.ok) {
        // Rollback if failed
        const fetchRes = await fetch("/api/alerts");
        const data = await fetchRes.json();
        if (data.success) setAlerts(data.alerts.filter((a: any) => !a.resolved));
      } else {
        if (onAlertDismissed) onAlertDismissed();
      }
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    } finally {
      setDismissingId(null);
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2.5 animate-fadeIn">
      {alerts.map((alert) => {
        const isHighSeverity = alert.severity === "HIGH" || alert.type.includes("UNAUTHORIZED") || alert.type.includes("FORCE_BLOCK");
        
        return (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isHighSeverity
                ? "bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-rose-950/30"
                : "bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-amber-950/30"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isHighSeverity
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {isHighSeverity ? (
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-sm text-white tracking-tight">{alert.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isHighSeverity
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {alert.severity} SEVERITY
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.description}</p>

                <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-[11px] font-mono text-slate-400">
                  {alert.ipAddress && (
                    <span className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50">
                      IP: <span className="text-slate-200">{alert.ipAddress}</span>
                    </span>
                  )}
                  {alert.clientCode && (
                    <span className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50">
                      Client: <span className="text-teal-300 font-semibold">{alert.clientCode}</span>
                    </span>
                  )}
                  <span className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50">
                    Type: <span className="text-slate-300">{alert.type}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleDismiss(alert.id)}
                disabled={dismissingId === alert.id}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Dismiss Security Alert"
              >
                {dismissingId === alert.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
