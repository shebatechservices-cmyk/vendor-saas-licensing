"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useClients } from "@/hooks/useClients";
import { SecurityAlertsBanner } from "@/components/SecurityAlertsBanner";
import { ClientDetailsModal } from "@/components/ClientDetailsModal";
import { ApiIntegrationGuide } from "@/components/ApiIntegrationGuide";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { MasterKillswitchTable } from "@/components/dashboard/MasterKillswitchTable";
import { VaultSummaryCard } from "@/components/dashboard/VaultSummaryCard";
import { TelemetryFeed } from "@/components/dashboard/TelemetryFeed";

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

      {/* Top Banner */}
      <DashboardHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />

      {/* KPI Metrics Overview Grid */}
      <MetricsOverview stats={stats} />

      {/* Master Kill-switch & Client Subscriptions Controller */}
      <MasterKillswitchTable
        clients={clients}
        togglingId={togglingId}
        onToggleStatus={handleToggle}
        onExtendTrial={handleExtendTrial}
        onRenew={handleRenew}
        onForceBlock={handleForceBlock}
        onSelectClient={setSelectedClient}
      />

      {/* Code Vault Summary & Live Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <VaultSummaryCard stats={stats} />
        <TelemetryFeed heartbeats={stats?.recentHeartbeats} />
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
