"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Key,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Activity,
  Globe,
  GraduationCap,
} from "lucide-react";
import { ClientStatusBadge } from "./ClientStatusBadge";

interface ClientDetailsModalProps {
  client: any;
  onClose: () => void;
  onToggleStatus: (clientId: string, currentStatus: string) => Promise<any>;
}

export function ClientDetailsModal({
  client,
  onClose,
  onToggleStatus,
}: ClientDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggle = async () => {
    setToggling(true);
    await onToggleStatus(client.id, client.status);
    setToggling(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">{client.name}</h3>
              <ClientStatusBadge status={client.status} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Client Code: <span className="font-mono text-emerald-400 font-semibold">{client.clientCode}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Credentials Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            Remote API Credentials (Client App & Sheba ERP Integration)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Client ID / Code</span>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-xs">
                <span>{client.clientCode}</span>
                <button
                  onClick={() => copyToClipboard(client.clientCode, "code")}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedField === "code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Secret Key</span>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-amber-300 text-xs">
                <span className="truncate mr-2">{client.secretKey}</span>
                <button
                  onClick={() => copyToClipboard(client.secretKey, "secret")}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedField === "secret" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quota & Live Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Student Capacity</span>
            <span className="text-xl font-black text-purple-300">
              {client.quotas?.usedStudents || 0} / {client.studentQuota}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Enrolled / Total Limit</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Storage Quota</span>
            <span className="text-xl font-black text-cyan-300">{client.storageQuotaGb} GB</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cloud Document Storage</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Outstanding Dues</span>
            <span className="text-xl font-black text-amber-400">
              {(client.currentDueBdt || 0).toLocaleString()} BDT
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Billed: {(client.totalBilledBdt || 0).toLocaleString()} BDT
            </span>
          </div>
        </div>

        {/* Expiry Timelines */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Service Subscriptions & Expiry Dates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold">App License</div>
              <div className="font-semibold text-slate-200 mt-1">
                {client.isLifetime
                  ? "Lifetime Unlimited"
                  : client.licenseExpiresAt
                  ? new Date(client.licenseExpiresAt).toLocaleDateString()
                  : "Not configured"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Hosting Subscription</div>
              <div className="font-semibold text-slate-200 mt-1">
                {client.hostingExpiresAt
                  ? new Date(client.hostingExpiresAt).toLocaleDateString()
                  : "Not configured"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Domain Registry</div>
              <div className="font-semibold text-slate-200 mt-1">
                {client.domainExpiresAt
                  ? new Date(client.domainExpiresAt).toLocaleDateString()
                  : "Not configured"}
              </div>
            </div>
          </div>
        </div>

        {/* Live Connectivity */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className={`w-4 h-4 ${client.isOnline ? "text-emerald-400" : "text-slate-500"}`} />
            <div>
              <span className="font-bold text-slate-200">
                {client.isOnline ? "Live Connected" : "Currently Offline"}
              </span>
              <span className="text-slate-500 block text-[11px]">
                Last Heartbeat:{" "}
                {client.lastHeartbeatAt ? new Date(client.lastHeartbeatAt).toLocaleString() : "Never"}
              </span>
            </div>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-400">
            <div>IP: {client.lastPingIp || "N/A"}</div>
            <div>Ver: {client.lastAppVersion || "v2.x"}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              client.status === "ACTIVE"
                ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40"
                : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
            }`}
          >
            {client.status === "ACTIVE" ? "Block / Suspend Client App" : "Unblock & Activate Client"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
