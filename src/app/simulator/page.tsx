"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  KeyRound,
  Zap,
  Server,
} from "lucide-react";
import { SimulatorHeader } from "@/components/simulator/SimulatorHeader";
import { HeartbeatSimulatorTab } from "@/components/simulator/HeartbeatSimulatorTab";
import { RedemptionSimulatorTab } from "@/components/simulator/RedemptionSimulatorTab";
import { CodeSnippetViewer } from "@/components/simulator/CodeSnippetViewer";

export default function SimulatorPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  // Heartbeat simulator state
  const [hbStudents, setHbStudents] = useState(350);
  const [hbAppVersion, setHbAppVersion] = useState("v2.4.1");
  const [hbStatus, setHbStatus] = useState("OPERATIONAL");
  const [hbLoading, setHbLoading] = useState(false);
  const [hbResponse, setHbResponse] = useState<any | null>(null);

  // Redemption simulator state
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResponse, setRedeemResponse] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<"heartbeat" | "redemption">("heartbeat");

  const fetchData = async () => {
    try {
      const [clientsRes, codesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/codes?status=AVAILABLE"),
      ]);

      const clientsData = await clientsRes.json();
      const codesData = await codesRes.json();

      if (clientsData.success && clientsData.clients.length > 0) {
        setClients(clientsData.clients);
        if (!selectedClientId) {
          setSelectedClientId(clientsData.clients[0].id);
        }
      }

      if (codesData.success) {
        setAvailableCodes(codesData.codes);
        if (codesData.codes.length > 0 && !redeemCode) {
          setRedeemCode(codesData.codes[0].code);
        }
      }
    } catch (err) {
      console.error("Failed to load simulator data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleSendHeartbeat = async () => {
    if (!currentClient) return;
    try {
      setHbLoading(true);
      const payload = {
        clientId: currentClient.clientCode,
        secretKey: currentClient.secretKey,
        appVersion: hbAppVersion,
        domain: currentClient.domain,
        statusReported: hbStatus,
        activeStudentsCount: hbStudents,
        databaseSizeMb: 128.4,
      };

      const res = await fetch("/api/vendor/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setHbResponse(data);
      await fetchData();
    } catch (err: any) {
      setHbResponse({ error: err.message });
    } finally {
      setHbLoading(false);
    }
  };

  const handleSendRedemption = async () => {
    if (!currentClient || !redeemCode) return;
    try {
      setRedeemLoading(true);
      const payload = {
        clientId: currentClient.clientCode,
        secretKey: currentClient.secretKey,
        code: redeemCode,
      };

      const res = await fetch("/api/vendor/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setRedeemResponse(data);
      await fetchData();
    } catch (err: any) {
      setRedeemResponse({ error: err.message });
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <SimulatorHeader
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
      />

      {/* Interactive Live Simulator Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Client App Simulation Request</h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("heartbeat")}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "heartbeat"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Heartbeat Ping
              </button>
              <button
                onClick={() => setActiveTab("redemption")}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "redemption"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Redeem Code
              </button>
            </div>
          </div>

          {activeTab === "heartbeat" ? (
            <HeartbeatSimulatorTab
              currentClient={currentClient}
              hbStudents={hbStudents}
              setHbStudents={setHbStudents}
              hbAppVersion={hbAppVersion}
              setHbAppVersion={setHbAppVersion}
              hbLoading={hbLoading}
              onSendHeartbeat={handleSendHeartbeat}
            />
          ) : (
            <RedemptionSimulatorTab
              currentClient={currentClient}
              redeemCode={redeemCode}
              setRedeemCode={setRedeemCode}
              availableCodes={availableCodes}
              redeemLoading={redeemLoading}
              onSendRedemption={handleSendRedemption}
            />
          )}
        </div>

        {/* Live Response Monitor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Vendor Backend Response Output</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">JSON Stream</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-h-[260px] max-h-[340px] overflow-y-auto">
            {activeTab === "heartbeat" ? (
              hbResponse ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs text-slate-400">Status Code:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        hbResponse.success
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {hbResponse.killswitch ? "KILLSWITCH TRIGGERED" : "HEALTHY ACK"}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(hbResponse, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Click &quot;Simulate Periodic Heartbeat Ping&quot; to test live telemetry response.
                </div>
              )
            ) : redeemResponse ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs text-slate-400">Redemption Status:</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      redeemResponse.success
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {redeemResponse.success ? "REDEEMED & APPLIED" : "ERROR"}
                  </span>
                </div>
                <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(redeemResponse, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Click &quot;Simulate Remote Code Redemption&quot; to test key activation and quota expansion.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SDK Documentation & Code Snippets */}
      <CodeSnippetViewer currentClient={currentClient} redeemCode={redeemCode} />
    </div>
  );
}
