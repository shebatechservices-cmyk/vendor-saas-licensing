"use client";

import { useEffect, useState } from "react";
import {
  Terminal,
  Activity,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Send,
  Zap,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Server,
  Play,
  ArrowRight
} from "lucide-react";

export default function SimulatorPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [copiedSdk, setCopiedSdk] = useState<string | null>(null);

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
  const [activeCodeLang, setActiveCodeLang] = useState<"nodejs" | "php" | "python" | "curl">("nodejs");

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
      // Refresh client state
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
      // Refresh client & available codes
      await fetchData();
    } catch (err: any) {
      setRedeemResponse({ error: err.message });
    } finally {
      setRedeemLoading(false);
    }
  };

  const copyCodeToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSdk(id);
    setTimeout(() => setCopiedSdk(null), 2000);
  };

  const nodeJsSnippet = `// Madrasa/School Client App - Strict Redemption Controller (Node.js / Express / Next.js)
import axios from 'axios';

const VENDOR_API_URL = 'http://localhost:3001';
const CLIENT_APP_ID = '${currentClient?.clientCode || "CLI-MADRASA-001"}';
const SECRET_KEY = '${currentClient?.secretKey || "sec_your_secret_key"}';

/**
 * STRICT CLIENT REDEMPTION CONTROLLER:
 * Rule 4: Trust Only Vendor! Do NOT trust any frontend input for code_type or duration.
 * Strictly parse the Vendor API's verified payload and update local DB dates accordingly.
 */
export async function handleClientCodeRedemption(userInputtedCode) {
  try {
    // 1. Send strictly the code and client credentials to Vendor App
    const response = await axios.post(\`\${VENDOR_API_URL}/api/vendor/redeem\`, {
      clientId: CLIENT_APP_ID,
      secretKey: SECRET_KEY,
      code: userInputtedCode
    });

    const data = response.data;

    // 2. Strict Check: If vendor did not return success, throw error
    if (!data.success) {
      throw new Error(data.error || 'Verification Failed');
    }

    // 3. Extract STRICT verified fields directly from Vendor DB response
    const { code_type, duration_years, is_lifetime, student_quota_added } = data;
    const now = new Date();

    // 4. Update Local Database based ONLY on Vendor's verified code_type
    switch (code_type) {
      case 'License':
        if (is_lifetime) {
          // Set local license to lifetime
          await db.systemSettings.update({ is_lifetime_license: true, license_expires_at: null });
        } else {
          // Extend local license expiry by verified years
          const currentExpiry = await db.systemSettings.getLicenseExpiry();
          const baseDate = currentExpiry && new Date(currentExpiry) > now ? new Date(currentExpiry) : now;
          baseDate.setFullYear(baseDate.getFullYear() + (duration_years || 1));
          await db.systemSettings.update({ license_expires_at: baseDate, is_suspended: false });
        }
        break;

      case 'Domain':
        // Extend local domain expiry by verified years
        const currentDomainExp = await db.systemSettings.getDomainExpiry();
        const baseDomainDate = currentDomainExp && new Date(currentDomainExp) > now ? new Date(currentDomainExp) : now;
        baseDomainDate.setFullYear(baseDomainDate.getFullYear() + (duration_years || 1));
        await db.systemSettings.update({ domain_expires_at: baseDomainDate });
        break;

      case 'Hosting':
        // Extend local hosting expiry by verified years
        const currentHostExp = await db.systemSettings.getHostingExpiry();
        const baseHostDate = currentHostExp && new Date(currentHostExp) > now ? new Date(currentHostExp) : now;
        baseHostDate.setFullYear(baseHostDate.getFullYear() + (duration_years || 1));
        await db.systemSettings.update({ hosting_expires_at: baseHostDate });
        break;

      case 'StudentQuota':
        // Expand local student quota capacity
        if (student_quota_added) {
          await db.systemSettings.incrementStudentQuota(student_quota_added);
        }
        break;

      default:
        throw new Error(\`Unrecognized verified code_type: \${code_type}\`);
    }

    return {
      success: true,
      message: \`Successfully redeemed \${data.duration} \${data.code_type} upgrade!\`,
      details: data
    };
  } catch (error) {
    // Returns "Invalid Code" or "Code already used" from Vendor
    const errorMessage = error.response?.data?.error || error.message;
    return { success: false, error: errorMessage };
  }
}`;

  const phpSnippet = `<?php
// Madrasa/School Client App - Strict Redemption Controller (PHP / Laravel)

function redeemCodeStrictly($userInputtedCode) {
    $vendorUrl = 'http://localhost:3001/api/vendor/redeem';
    $clientAppId = '${currentClient?.clientCode || "CLI-MADRASA-001"}';
    $secretKey = '${currentClient?.secretKey || "sec_your_secret_key"}';

    // 1. Call Vendor Redemption Endpoint
    $ch = curl_init($vendorUrl);
    $payload = json_encode([
        'clientId' => $clientAppId,
        'secretKey' => $secretKey,
        'code' => trim($userInputtedCode)
    ]);

    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $responseRaw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($responseRaw, true);

    // 2. Strict Check: If HTTP not 200 or success is false, return error
    if ($httpCode !== 200 || empty($data['success'])) {
        return [
            'success' => false,
            'error' => $data['error'] ?? 'Code Verification Failed'
        ];
    }

    // 3. Trust ONLY Vendor payload: Read verified code_type & duration directly from response
    $codeType = $data['code_type']; // "License" | "Domain" | "Hosting" | "StudentQuota"
    $durationYears = intval($data['duration_years'] ?? 1);

    // 4. Update Client App local DB strictly by code_type
    if ($codeType === 'License') {
        if (!empty($data['is_lifetime'])) {
            DB::table('settings')->update(['is_lifetime' => 1, 'license_expires_at' => null]);
        } else {
            $currentExpiry = DB::table('settings')->value('license_expires_at');
            $base = ($currentExpiry && strtotime($currentExpiry) > time()) ? strtotime($currentExpiry) : time();
            $newExpiry = date('Y-m-d H:i:s', strtotime("+$durationYears years", $base));
            DB::table('settings')->update(['license_expires_at' => $newExpiry, 'is_suspended' => 0]);
        }
    } elseif ($codeType === 'Domain') {
        $currentExpiry = DB::table('settings')->value('domain_expires_at');
        $base = ($currentExpiry && strtotime($currentExpiry) > time()) ? strtotime($currentExpiry) : time();
        $newExpiry = date('Y-m-d H:i:s', strtotime("+$durationYears years", $base));
        DB::table('settings')->update(['domain_expires_at' => $newExpiry]);
    } elseif ($codeType === 'Hosting') {
        $currentExpiry = DB::table('settings')->value('hosting_expires_at');
        $base = ($currentExpiry && strtotime($currentExpiry) > time()) ? strtotime($currentExpiry) : time();
        $newExpiry = date('Y-m-d H:i:s', strtotime("+$durationYears years", $base));
        DB::table('settings')->update(['hosting_expires_at' => $newExpiry]);
    } elseif ($codeType === 'StudentQuota') {
        $slots = intval($data['student_quota_added'] ?? 100);
        DB::table('settings')->increment('student_quota', $slots);
    }

    return [
        'success' => true,
        'message' => "Successfully applied {$data['duration']} {$data['code_type']} upgrade.",
        'data' => $data
    ];
}`;

  const curlSnippet = `# Strict Remote Code Redemption Request to Vendor App
curl -X POST http://localhost:3001/api/vendor/redeem \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "${currentClient?.clientCode || "CLI-MADRASA-001"}",
    "secretKey": "${currentClient?.secretKey || "sec_your_secret_key"}",
    "code": "${redeemCode || "LIC-Z4ZA-2A5E-A479"}"
  }'`;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
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
              onChange={(e) => setSelectedClientId(e.target.value)}
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
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
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
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
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
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div>
                  <span className="text-slate-500">Target Endpoint: </span>
                  <span className="text-cyan-300 font-bold">POST /api/vendor/heartbeat</span>
                </div>
                <div>
                  <span className="text-slate-500">Client Code: </span>
                  <span className="text-emerald-400">{currentClient?.clientCode}</span>
                </div>
                <div>
                  <span className="text-slate-500">Secret Key: </span>
                  <span className="text-amber-400">{currentClient?.secretKey}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Active Students Count</label>
                  <input
                    type="number"
                    value={hbStudents}
                    onChange={(e) => setHbStudents(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Client App Version</label>
                  <input
                    type="text"
                    value={hbAppVersion}
                    onChange={(e) => setHbAppVersion(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSendHeartbeat}
                disabled={hbLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2"
              >
                {hbLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Simulate Periodic Heartbeat Ping
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div>
                  <span className="text-slate-500">Target Endpoint: </span>
                  <span className="text-emerald-300 font-bold">POST /api/vendor/redeem</span>
                </div>
                <div>
                  <span className="text-slate-500">Client Code: </span>
                  <span className="text-emerald-400">{currentClient?.clientCode}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  License Code to Redeem
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAAS-7K9P-4M2X-8W1Q"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm tracking-wider"
                />
              </div>

              {availableCodes.length > 0 && (
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                    Quick Pick Available Code from Vault:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {availableCodes.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setRedeemCode(c.code)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono border ${
                          redeemCode === c.code
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {c.code} ({c.category.split("_")[0]})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSendRedemption}
                disabled={redeemLoading || !redeemCode}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {redeemLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                Simulate Remote Code Redemption
              </button>
            </div>
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              Client Software Integration SDK Snippets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Embed into client applications (e.g., Madrasa or School ERPs) for automated heartbeats and remote license renewal.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(["nodejs", "php", "curl"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveCodeLang(lang)}
                className={`px-3 py-1 rounded-lg font-bold uppercase transition ${
                  activeCodeLang === lang
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() =>
              copyCodeToClipboard(
                activeCodeLang === "nodejs"
                  ? nodeJsSnippet
                  : activeCodeLang === "php"
                  ? phpSnippet
                  : curlSnippet,
                "sdk"
              )
            }
            className="absolute right-4 top-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition z-10"
          >
            {copiedSdk === "sdk" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy SDK Code
              </>
            )}
          </button>

          <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
            {activeCodeLang === "nodejs" && nodeJsSnippet}
            {activeCodeLang === "php" && phpSnippet}
            {activeCodeLang === "curl" && curlSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
