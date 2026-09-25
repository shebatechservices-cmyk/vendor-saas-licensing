"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useClients } from "@/hooks/useClients";
import { StatCard } from "@/components/StatCard";
import { ClientStatusBadge } from "@/components/ClientStatusBadge";
import { GracePeriodBadge } from "@/components/GracePeriodBadge";
import { SecurityAlertsBanner } from "@/components/SecurityAlertsBanner";
import { ClientDetailsModal } from "@/components/ClientDetailsModal";
import { ApiIntegrationGuide } from "@/components/ApiIntegrationGuide";

export default function MasterDashboardPage() {
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats(5000);
  const {
    clients,
    loading: clientsLoading,
    togglingId,
    toggleClientStatus,
    extendTrial,
    renewLicense,
    forceBlock,
    refetch: refetchClients,
  } = useClients("ALL");

  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchClients()]);
  };

  const handleToggle = async (clientId: string, currentStatus: string) => {
    const res = await toggleClientStatus(clientId, currentStatus);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Client status changed to ${res.client.status}.`,
      });
      await refetchStats();
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient({ ...selectedClient, status: res.client.status });
      }
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update status." });
    }
  };

  // Feature 3: Inline Quick Actions
  const handleExtendTrial = async (client: any) => {
    const res = await extendTrial(client.id, 7);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Trial for ${client.name} extended by +7 days successfully!`,
      });
      await refetchStats();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to extend trial." });
    }
  };

  const handleRenew = async (client: any) => {
    const res = await renewLicense(client.id, 1);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `License for ${client.name} renewed for +1 Year successfully!`,
      });
      await refetchStats();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to renew license." });
    }
  };

  const handleForceBlock = async (client: any) => {
    if (!confirm(`Are you sure you want to FORCE BLOCK "${client.name}"? Instant killswitch will be activated.`)) {
      return;
    }
    const res = await forceBlock(client.id, "Force blocked via Dashboard Quick Action");
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Client ${client.name} forcefully blocked. Killswitch active.`,
      });
      await refetchStats();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to force block client." });
    }
  };

  const isRefreshing = statsLoading || clientsLoading;

  return (
    <div className="space-y-8">
      {/* Feature 4: Security Alerts Banner */}
      {stats?.securityAlerts && stats.securityAlerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Recent Security Alerts & Threat Telemetry</span>
          </div>
          <SecurityAlertsBanner
            initialAlerts={stats.securityAlerts}
            onAlertDismissed={handleRefresh}
          />
        </div>
      )}

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between animate-fadeIn ${
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
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Master Control Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Vendor SaaS Master Controller</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sync Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise management hub for Client Subscriptions, Killswitch Directives, Code Pre-generation & Accounting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            Refresh Telemetry
          </button>
          <Link
            href="/codes"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Codes
          </Link>
          <Link
            href="/simulator"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            Integration Simulator
          </Link>
        </div>
      </div>

      {/* KPI Metrics Overview Grid */}
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
                <span className="text-base font-black text-amber-300 mt-0.5">{stats?.clients?.inGracePeriod ?? 0} (&le;48h)</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Offline</span>
                <span className="text-base font-black text-slate-300 mt-0.5">{stats?.clients?.criticalOffline ?? 0} (&gt;48h)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Ping Cycle</span>
            <span className="text-emerald-400 font-mono font-semibold">Every 2-5 min</span>
          </div>
        </div>

        <StatCard
          title="Student Quota Capacity"
          value={stats?.students?.totalSlots?.toLocaleString() ?? 0}
          subtitle="Total Slots Sold"
          icon={GraduationCap}
          colorScheme="purple"
          footerLeft={<span className="text-slate-400">Active Enrolled</span>}
          footerRight={
            <span className="text-purple-400 font-semibold">
              {stats?.students?.activeEnrolled?.toLocaleString() ?? 0}
            </span>
          }
        />

        <StatCard
          title="Financial Ledger"
          value={`${(stats?.finance?.totalBilledBdt ?? 0).toLocaleString()} BDT`}
          subtitle="Total Billed"
          icon={DollarSign}
          colorScheme="amber"
          footerLeft={
            <span className="text-emerald-400 font-medium">
              {(stats?.finance?.totalPaidBdt ?? 0).toLocaleString()} BDT Paid
            </span>
          }
          footerRight={
            <span className="text-rose-400 font-bold">
              {(stats?.finance?.totalOutstandingDuesBdt ?? 0).toLocaleString()} BDT Due
            </span>
          }
        />
      </div>

      {/* Master Kill-switch & Client Subscriptions Controller */}
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

          <Link
            href="/clients"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition self-start sm:self-auto"
          >
            <span>Manage All Clients</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
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
                      <GracePeriodBadge
                        isOnline={c.isOnline}
                        inGracePeriod={c.inGracePeriod}
                        isCriticalOffline={c.isCriticalOffline}
                        graceRemainingHours={c.graceRemainingHours}
                        lastHeartbeatAt={c.lastHeartbeatAt}
                        size="sm"
                      />
                      <div className="mt-1.5">
                        <ClientStatusBadge status={c.status} size="sm" />
                      </div>
                    </td>

                    {/* Feature 3: Discrete Inline Quick Actions & Killswitch */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Extend Trial Button */}
                        <button
                          type="button"
                          onClick={() => handleExtendTrial(c)}
                          disabled={togglingId === c.id}
                          className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition cursor-pointer disabled:opacity-50"
                          title="Extend Trial (+7 Days)"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Renew License Button */}
                        <button
                          type="button"
                          onClick={() => handleRenew(c)}
                          disabled={togglingId === c.id}
                          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
                          title="Renew License (+1 Year)"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>

                        {/* Force Block Button */}
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

                        {/* Master Toggle Lock/Unlock */}
                        <button
                          onClick={() => handleToggle(c.id, c.status)}
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

                        {/* Inspect Details */}
                        <button
                          onClick={() => setSelectedClient(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                          title="Inspect Credentials & Subscriptions"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* Code Vault Summary & Live Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pre-Generated Vault Inventory */}
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

        {/* Live Heartbeat Audit Log */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Live Heartbeat Telemetry Feed</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Real-time Webhook Pings</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
            {stats?.recentHeartbeats?.length > 0 ? (
              stats.recentHeartbeats.map((hb: any) => {
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
      </div>

      {/* Integration Guide Section */}
      <ApiIntegrationGuide />

      {/* Client Deep Details Modal */}
      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onToggleStatus={handleToggle}
        />
      )}
    </div>
  );
}
