"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  KeyRound,
  GraduationCap,
  DollarSign,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Zap,
  PlusCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Server,
  Lock,
  Unlock,
  Clock,
  CalendarPlus,
  Ban,
  Sparkles,
  X,
  WifiOff,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [statsRes, clientsRes, alertsRes] = await Promise.all([
        fetch("/api/stats").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/clients").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/alerts").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (clientsRes.success) setClients(clientsRes.clients);
      if (alertsRes.success) setAlerts(alertsRes.alerts || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Feature 3: Inline Quick Actions
  const handleExtendTrial = async (client) => {
    try {
      setTogglingId(client.id);
      const res = await fetch(`/api/clients/${client.id}/extend-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: `Trial for ${client.name} extended by +7 days successfully!`,
        });
        fetchData();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to extend trial." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setTogglingId(null);
    }
  };

  const handleRenew = async (client) => {
    try {
      setTogglingId(client.id);
      const res = await fetch(`/api/clients/${client.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ years: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: `License for ${client.name} renewed for +1 Year successfully!`,
        });
        fetchData();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to renew license." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setTogglingId(null);
    }
  };

  const handleForceBlock = async (client) => {
    if (!confirm(`Are you sure you want to FORCE BLOCK "${client.name}"? Instant killswitch will be activated.`)) {
      return;
    }
    try {
      setTogglingId(client.id);
      const res = await fetch(`/api/clients/${client.id}/force-block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Force blocked via Dashboard Quick Action" }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: `Client ${client.name} forcefully blocked. Killswitch active.`,
        });
        fetchData();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to force block client." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleStatus = async (client) => {
    const isBlocked = client.status === "BLOCKED" || client.status === "SUSPENDED";
    const nextStatus = isBlocked ? "ACTIVE" : "BLOCKED";
    try {
      setTogglingId(client.id);
      const res = await fetch(`/api/clients/${client.id}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: `Client status changed to ${data.client.status}.`,
        });
        fetchData();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to update status." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      await fetch(`/api/alerts/${alertId}/dismiss`, { method: "POST" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Feature 4: Security Alerts Banner */}
      {alerts && alerts.filter((a) => !a.resolved).length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Recent Security Alerts & Threat Telemetry</span>
          </div>

          <div className="space-y-2">
            {alerts
              .filter((a) => !a.resolved)
              .map((alert) => {
                const isHigh =
                  alert.severity === "HIGH" ||
                  alert.type.includes("UNAUTHORIZED") ||
                  alert.type.includes("FORCE_BLOCK");

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isHigh
                        ? "bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-rose-950/30"
                        : "bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-amber-950/30"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isHigh
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {isHigh ? (
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
                              isHigh
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
                        onClick={() => handleDismissAlert(alert.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Vendor SaaS Master Controller</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Sync Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise management hub for Client Subscriptions, Killswitch Directives, Code Pre-generation & Accounting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Feature 1: Client Subscriptions with Active Trials & Expiring Soon Metrics */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Subscriptions</span>
              <div className="w-9 h-9 rounded-xl border flex items-center justify-center bg-blue-500/10 border-blue-500/20 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats?.clients?.total ?? 0}</span>
              <span className="text-xs text-slate-400">Instances Deployed</span>
            </div>

            {/* Trial & Expiring Soon Badges */}
            <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Active Trials</span>
                <span className="text-base font-black text-cyan-300 mt-0.5">{stats?.clients?.activeTrials ?? 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Expiring (1-3d)</span>
                <span className="text-base font-black text-amber-300 mt-0.5">{stats?.clients?.expiringSoon ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {stats?.clients?.active ?? 0} Active
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              {stats?.clients?.blocked ?? 0} Blocked
            </span>
          </div>
        </div>

        {/* Feature 2: Live Connectivity with Grace Period & Critical Offline Monitoring */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Connectivity</span>
              <div className="w-9 h-9 rounded-xl border flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{stats?.clients?.online ?? 0}</span>
              <span className="text-xs text-slate-400">Heartbeats Live (&lt;10m)</span>
            </div>

            {/* Grace Period Sub-metrics */}
            <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Grace Period</span>
                <span className="text-base font-black text-amber-300 mt-0.5">
                  {stats?.clients?.inGracePeriod ?? 0} (≤48h)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Offline</span>
                <span className="text-base font-black text-slate-300 mt-0.5">
                  {stats?.clients?.criticalOffline ?? 0} (&gt;48h)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Ping Cycle</span>
            <span className="text-emerald-400 font-mono font-semibold">Every 2-5 min</span>
          </div>
        </div>

        {/* Quota Stats */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Student Quota</span>
              <div className="w-9 h-9 rounded-xl border flex items-center justify-center bg-purple-500/10 border-purple-500/20 text-purple-400">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {stats?.students?.totalSlots?.toLocaleString() ?? 0}
              </span>
              <span className="text-xs text-slate-400">Total Slots Sold</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Enrolled</span>
            <span className="text-purple-400 font-semibold">
              {stats?.students?.activeEnrolled?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>

        {/* Financial Ledger */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Financial Ledger</span>
              <div className="w-9 h-9 rounded-xl border flex items-center justify-center bg-amber-500/10 border-amber-500/20 text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {(stats?.finance?.totalBilledBdt ?? 0).toLocaleString()} BDT
              </span>
              <span className="text-xs text-slate-400">Total Billed</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium">
              {(stats?.finance?.totalPaidBdt ?? 0).toLocaleString()} BDT Paid
            </span>
            <span className="text-rose-400 font-bold">
              {(stats?.finance?.totalOutstandingDuesBdt ?? 0).toLocaleString()} BDT Due
            </span>
          </div>
        </div>
      </div>

      {/* Master Control Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Master Control: Client Subscriptions & Killswitch</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Activate, block, or suspend any client application in real-time. Blocked apps are instantly locked on next heartbeat.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Client Application</th>
                <th className="py-3.5 px-6">Domain / Endpoint</th>
                <th className="py-3.5 px-6">License Expiry</th>
                <th className="py-3.5 px-6">Student Quota</th>
                <th className="py-3.5 px-6">Live Connectivity & Grace</th>
                <th className="py-3.5 px-6 text-right">Quick Actions & Killswitch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {clients.map((c) => {
                const isBlocked = c.status === "BLOCKED" || c.status === "SUSPENDED";
                const isTrial = c.isTrial;
                const isExpiringSoon = c.isExpiringSoon;
                const isExpired = !c.isLifetime && c.licenseExpiresAt && new Date(c.licenseExpiresAt) < new Date();

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        {isTrial && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Trial
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{c.clientCode}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-slate-200 font-mono">{c.domain || "N/A"}</div>
                      <div className="text-[11px] text-slate-500">{c.appType}</div>
                    </td>

                    <td className="py-4 px-6">
                      {c.isLifetime ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Lifetime License
                        </span>
                      ) : c.licenseExpiresAt ? (
                        <div>
                          <div className="text-slate-300 font-medium">
                            {new Date(c.licenseExpiresAt).toLocaleDateString()}
                          </div>
                          {isExpiringSoon ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 mt-0.5 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Expiring Soon (1-3d)
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] font-bold text-rose-400 mt-0.5 block">
                              Expired
                            </span>
                          ) : (
                            <div className="text-[10px] text-slate-500">
                              {Math.ceil((new Date(c.licenseExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">Not configured</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-200">{c.quotas?.usedStudents || 0}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-purple-400">{c.studentQuota}</span>
                        <span className="text-[10px] text-slate-500 font-normal uppercase">slots</span>
                      </div>
                    </td>

                    {/* Feature 2: Grace Period Monitoring in Table */}
                    <td className="py-4 px-6">
                      {c.isOnline ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                          <span className="inline-flex items-center gap-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px]">
                            <Activity className="w-3 h-3" />
                            <span>Online</span>
                          </span>
                        </div>
                      ) : c.inGracePeriod ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span
                            className="inline-flex items-center gap-1 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px]"
                            title="Offline within 48h grace period"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Grace Period ({c.graceRemainingHours || 0}h left)</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                          <span className="inline-flex items-center gap-1 rounded-full font-medium bg-slate-800/80 text-slate-400 border border-slate-700/80 px-2 py-0.5 text-[10px]">
                            <WifiOff className="w-3 h-3 text-slate-500" />
                            <span>{c.lastHeartbeatAt ? "Offline (>48h)" : "Never Connected"}</span>
                          </span>
                        </div>
                      )}

                      <div className="mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isBlocked
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </td>

                    {/* Feature 3: Discrete Inline Quick Actions & Killswitch */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Extend Trial */}
                        <button
                          type="button"
                          onClick={() => handleExtendTrial(c)}
                          disabled={togglingId === c.id}
                          className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition cursor-pointer disabled:opacity-50"
                          title="Extend Trial (+7 Days)"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Renew License */}
                        <button
                          type="button"
                          onClick={() => handleRenew(c)}
                          disabled={togglingId === c.id}
                          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
                          title="Renew License (+1 Year)"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>

                        {/* Force Block */}
                        {!isBlocked && (
                          <button
                            type="button"
                            onClick={() => handleForceBlock(c)}
                            disabled={togglingId === c.id}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition cursor-pointer disabled:opacity-50"
                            title="Force Block (Master Killswitch)"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Master Toggle */}
                        <button
                          onClick={() => handleToggleStatus(c)}
                          disabled={togglingId === c.id}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            !isBlocked
                              ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30"
                              : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {togglingId === c.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : !isBlocked ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              <span className="hidden sm:inline">Block</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">Unblock</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Heartbeat Telemetry Feed */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Live Heartbeat Telemetry Feed</h3>
          </div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Auto-Sync Active (&lt;10m Live)
          </span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
          {stats?.recentHeartbeats?.length > 0 ? (
            stats.recentHeartbeats.map((hb) => {
              const isOnline = hb.isOnlineWithin10m ?? true;
              const displayName = hb.clientName || hb.client?.name || "Client Application";
              const displayCode = hb.clientCode || hb.client?.clientCode;

              return (
                <div
                  key={hb.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        isOnline
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
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
                        {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
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
                        isOnline &&
                        (hb.statusReported === "OPERATIONAL" ||
                          hb.statusReported === "OK" ||
                          hb.live_status === "ONLINE")
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
              No heartbeats recorded yet. Heartbeats pinged within the last 10 minutes will appear here automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
