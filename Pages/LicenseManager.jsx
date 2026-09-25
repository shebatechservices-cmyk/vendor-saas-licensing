"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Plus,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Laptop,
  Power,
  Trash2,
  Calendar,
  AlertTriangle,
  X,
  Radio,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function LicenseManager() {
  const [licenses, setLicenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedKey, setCopiedKey] = useState(null);

  // Generate Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clientName, setClientName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [validityYears, setValidityYears] = useState("1");
  const [generatedResult, setGeneratedResult] = useState(null);

  // Notification / Feedback
  const [feedback, setFeedback] = useState(null);

  // Fetch licenses
  const fetchLicenses = async () => {
    try {
      const res = await fetch("/api/license");
      const data = await res.json();
      if (data.success) {
        setLicenses(data.licenses || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load licenses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
    const interval = setInterval(fetchLicenses, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  // Handle Generate License
  const handleGenerateLicense = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/license/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName.trim(),
          mac_address: macAddress.trim() || undefined,
          validity_years: validityYears === "Lifetime" ? "Lifetime" : parseInt(validityYears, 10),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedResult(data.license);
        setFeedback({ type: "success", message: "License key generated successfully!" });
        fetchLicenses();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to generate license" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network connection error" });
    } finally {
      setGenerating(false);
    }
  };

  // Handle Direct Kill Switch Toggle
  const handleToggleKillswitch = async (license) => {
    const isCurrentlyActive = license.status === "Active";
    const nextStatus = isCurrentlyActive ? "Suspended" : "Active";

    // Optimistic UI update
    setLicenses((prev) =>
      prev.map((l) => (l.id === license.id ? { ...l, status: nextStatus } : l))
    );

    try {
      const res = await fetch("/api/license/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: license.id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback
        fetchLicenses();
        setFeedback({ type: "error", message: data.error || "Failed to toggle kill switch" });
      } else {
        setFeedback({
          type: "success",
          message: `Kill switch toggled: License for [${license.client_name}] is now ${nextStatus.toUpperCase()}.`,
        });
        fetchLicenses();
      }
    } catch (err) {
      fetchLicenses();
      setFeedback({ type: "error", message: "Failed to update license status" });
    }
  };

  // Handle Delete License
  const handleDeleteLicense = async (id, clientName) => {
    if (!confirm(`Are you sure you want to permanently delete the license for "${clientName}"?`)) return;

    try {
      const res = await fetch(`/api/license?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: `License for [${clientName}] deleted.` });
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered licenses
  const filteredLicenses = licenses.filter((l) => {
    const matchesSearch =
      l.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.mac_address && l.mac_address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && l.status === "Active") ||
      (statusFilter === "SUSPENDED" && (l.status === "Suspended" || l.status === "Blocked")) ||
      (statusFilter === "EXPIRED" && l.status === "Expired");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Client License Engine & Kill Switch
              </h1>
              <p className="text-xs text-slate-400">
                Generate cryptographic keys, monitor heartbeat telemetry, and enforce instant remote killswitch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLicenses}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setGeneratedResult(null);
              setClientName("");
              setMacAddress("");
              setIsGenerateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New License</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Licenses</span>
            <KeyRound className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Issued across all clients</div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Active Authorized</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-2">{stats.active}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Valid & operational</div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Killswitch Active</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-2">{stats.suspended}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Access suspended / blocked</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Expired</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{stats.expired}</div>
          <div className="text-[11px] text-slate-500 mt-1">Renewal required</div>
        </div>
      </div>

      {/* Notification Banner */}
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
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, key, MAC..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["ALL", "ACTIVE", "SUSPENDED", "EXPIRED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* License List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Client & Organization</th>
                <th className="px-5 py-3.5">License Key</th>
                <th className="px-5 py-3.5">MAC / Hardware</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5">Heartbeat</th>
                <th className="px-5 py-3.5 text-center">Kill Switch</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No licenses found matching criteria</p>
                    <p className="text-[11px] mt-1">Click "Generate New License" to issue your first license key.</p>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => {
                  const isActive = license.status === "Active";
                  const isSuspended = license.status === "Suspended" || license.status === "Blocked";
                  const isExpired = license.status === "Expired";

                  return (
                    <tr
                      key={license.id}
                      className={`hover:bg-slate-800/40 transition-all ${
                        isSuspended ? "bg-rose-950/10" : ""
                      }`}
                    >
                      {/* Client Name */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-100 text-sm">{license.client_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ID: {license.id.slice(0, 10)}...
                        </div>
                      </td>

                      {/* License Key */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-teal-300 font-bold text-xs select-all">
                            {license.license_key}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(license.license_key, license.id)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Copy License Key"
                          >
                            {copiedKey === license.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* MAC Address */}
                      <td className="px-5 py-4 font-mono">
                        {license.mac_address ? (
                          <span className="flex items-center gap-1.5 text-slate-200">
                            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{license.mac_address}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic font-sans text-[11px]">
                            Any Hardware (Auto-bind)
                          </span>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-5 py-4">
                        {license.expiry_date ? (
                          <div>
                            <div className="text-slate-200 font-medium">
                              {new Date(license.expiry_date).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {isExpired ? (
                                <span className="text-rose-400 font-bold">Expired</span>
                              ) : (
                                `Expires in ${Math.ceil(
                                  (new Date(license.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                                )} days`
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold text-[10px]">
                            LIFETIME
                          </span>
                        )}
                      </td>

                      {/* Heartbeat Status */}
                      <td className="px-5 py-4">
                        {license.last_heartbeat ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <div>
                              <div className="text-[11px] text-slate-300 font-mono">
                                {new Date(license.last_heartbeat).toLocaleTimeString()}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {license.ip_address || "127.0.0.1"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">No ping yet</span>
                        )}
                      </td>

                      {/* KILL SWITCH DIRECT TOGGLE */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleKillswitch(license)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? "bg-emerald-500" : "bg-rose-600"
                            }`}
                            title={
                              isActive
                                ? "Kill Switch is OFF (Active). Click to INSTANTLY KILL / BLOCK access."
                                : "Kill Switch is ON (Suspended). Click to restore access."
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isActive ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? "text-emerald-400"
                                : isSuspended
                                ? "text-rose-400"
                                : "text-slate-400"
                            }`}
                          >
                            {isActive ? "Active" : "Blocked"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteLicense(license.id, license.client_name)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete License"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE LICENSE MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Issue Client License Key</h3>
                  <p className="text-xs text-slate-400">Generate a cryptographically unique license</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-100 text-sm">License Issued Successfully!</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Assigned to: {generatedResult.client_name}</p>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Generated License Key:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedResult.license_key}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/50 font-mono text-emerald-300 font-bold text-sm text-center"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedResult.license_key, "modal")}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === "modal" ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedResult(null);
                      setIsGenerateModalOpen(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateLicense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Client / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Darul Uloom Madrasa, Dhaka"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hardware MAC Address (Optional - locks license to specific device)
                  </label>
                  <input
                    type="text"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="e.g. 00:1A:2B:3C:4D:5E (Leave empty to auto-bind)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    License Validity
                  </label>
                  <select
                    value={validityYears}
                    onChange={(e) => setValidityYears(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="1">1 Year Subscription</option>
                    <option value="2">2 Years Subscription</option>
                    <option value="3">3 Years Subscription</option>
                    <option value="5">5 Years Enterprise</option>
                    <option value="10">10 Years Long-Term</option>
                    <option value="Lifetime">Lifetime License</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating || !clientName.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Issue License Key
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
