"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  PlusCircle,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  RefreshCw
} from "lucide-react";
import { calculateFromCredits, calculateLicensePrice } from "@/lib/quota-calc";

export default function CodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Generator form state
  const [category, setCategory] = useState<
    "APP_LICENSE" | "HOSTING_RENEWAL" | "DOMAIN_RENEWAL" | "STUDENT_QUOTA_UPGRADE"
  >("APP_LICENSE");
  const [validityYears, setValidityYears] = useState(1);
  const [isLifetime, setIsLifetime] = useState(false);
  const [quotaCredits, setQuotaCredits] = useState(1000);
  const [quantity, setQuantity] = useState(5);
  const [batchName, setBatchName] = useState("");
  const [assignedClientId, setAssignedClientId] = useState("");
  const [notes, setNotes] = useState("");

  // Real-time calculation previews
  const quotaCalc = calculateFromCredits(quotaCredits);
  const licensePriceInfo = calculateLicensePrice(category, validityYears, isLifetime, quotaCredits);
  const unitPrice = category === "STUDENT_QUOTA_UPGRADE" ? quotaCalc.priceBdt : licensePriceInfo.priceBdt;
  const totalBatchPrice = unitPrice * quantity;

  const fetchCodesAndClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== "ALL") params.append("category", filterCategory);
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const [codesRes, clientsRes] = await Promise.all([
        fetch(`/api/codes?${params.toString()}`),
        fetch("/api/clients"),
      ]);

      const codesData = await codesRes.json();
      const clientsData = await clientsRes.json();

      if (codesData.success) {
        setCodes(codesData.codes);
        setBatches(codesData.batches);
      }
      if (clientsData.success) {
        setClients(clientsData.clients);
      }
    } catch (err) {
      console.error("Failed to fetch codes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodesAndClients();
  }, [filterCategory, filterStatus, searchQuery]);

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const payload = {
        category,
        validityYears: isLifetime ? null : validityYears,
        isLifetime,
        quotaCredits: category === "STUDENT_QUOTA_UPGRADE" ? quotaCredits : null,
        quantity,
        batchName: batchName || undefined,
        assignedClientId: assignedClientId || undefined,
        notes: notes || undefined,
      };

      const res = await fetch("/api/codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setBatchName("");
        setNotes("");
        await fetchCodesAndClients();
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (err) {
      console.error("Error generating codes:", err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exportCsv = () => {
    const headers = "Code,Category,Validity,PriceBDT,Status,Batch,AssignedClient,RedeemedClient,Created\n";
    const rows = codes
      .map((c) => {
        const val = c.isLifetime
          ? "Lifetime"
          : c.studentQuotaAdded
          ? `+${c.studentQuotaAdded} Students`
          : `${c.validityYears || 1} Year(s)`;
        return `"${c.code}","${c.category}","${val}","${c.priceBdt}","${c.status}","${
          c.batch?.batchNumber || ""
        }","${c.assignedClient?.name || ""}","${c.redeemedClient?.name || ""}","${new Date(
          c.createdAt
        ).toISOString()}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendor_license_codes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <KeyRound className="w-7 h-7 text-emerald-400" />
            <span>Code Generation Engine & Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-generate batches of cryptographically secure alphanumeric license, renewal, and quota upgrade keys.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={codes.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export CSV ({codes.length})
        </button>
      </div>

      {/* Code Generation Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Batch Pre-Generation Configuration</h2>
        </div>

        <form onSubmit={handleGenerateCodes} className="space-y-6">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select License / Service Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: "APP_LICENSE", label: "App License", desc: "Core SaaS Software Validity" },
                { id: "STUDENT_QUOTA_UPGRADE", label: "Student Quota Upgrade", desc: "1000 Credits = 2000 BDT = 100 Students" },
                { id: "HOSTING_RENEWAL", label: "Hosting Renewal", desc: "Cloud Server Hosting" },
                { id: "DOMAIN_RENEWAL", label: "Domain Renewal", desc: ".edu.bd / .com Registry" },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    category === cat.id
                      ? "bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs text-white">{cat.label}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Options: Validity or Quota */}
          {category === "STUDENT_QUOTA_UPGRADE" ? (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                Madrasa / School Quota Formula: 1000 Credits = 2000 BDT (10 Credits = 1 Student)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Credits Amount</label>
                  <select
                    value={quotaCredits}
                    onChange={(e) => setQuotaCredits(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value={500}>500 Credits (+50 Students = 1,000 BDT)</option>
                    <option value={1000}>1,000 Credits (+100 Students = 2,000 BDT)</option>
                    <option value={2000}>2,000 Credits (+200 Students = 4,000 BDT)</option>
                    <option value={5000}>5,000 Credits (+500 Students = 10,000 BDT)</option>
                    <option value={10000}>10,000 Credits (+1000 Students = 20,000 BDT)</option>
                  </select>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400">Student Slots Added</span>
                  <span className="text-lg font-black text-purple-300">+{quotaCalc.students} Students</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400">Unit Price (BDT)</span>
                  <span className="text-lg font-black text-amber-400">{quotaCalc.priceFormatted}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">
                  License Validity Duration
                </label>
                <select
                  disabled={isLifetime}
                  value={validityYears}
                  onChange={(e) => setValidityYears(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((y) => (
                    <option key={y} value={y}>
                      {y} Year(s) Validity
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="lifetimeCheck"
                  checked={isLifetime}
                  onChange={(e) => setIsLifetime(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="lifetimeCheck" className="text-xs font-bold text-white cursor-pointer">
                  Lifetime Unlimited Validity
                </label>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Unit Standard Price</span>
                <span className="text-base font-black text-amber-400">
                  {unitPrice.toLocaleString()} BDT
                </span>
              </div>
            </div>
          )}

          {/* Batch Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">
                Batch Quantity (Keys to generate)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">Batch Label / Name</label>
              <input
                type="text"
                placeholder="e.g. Q1 2026 Madrasa Expansion"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">
                Lock / Pre-Assign to Client (Optional)
              </label>
              <select
                value={assignedClientId}
                onChange={(e) => setAssignedClientId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              >
                <option value="">Unassigned (Available for any client)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.clientCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Summary & Submit */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">
                Total Batch Valuation:{" "}
                <strong className="text-white text-sm font-black">{totalBatchPrice.toLocaleString()} BDT</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Format: <code className="text-emerald-400 font-mono">SAAS-XXXX-XXXX-XXXX</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Keys...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Generate {quantity} Secure Code(s)
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Code Vault Table */}
      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {["ALL", "AVAILABLE", "ASSIGNED", "USED", "REVOKED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStatus === st
                    ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, batch, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">License Code</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Validity / Benefit</th>
                  <th className="py-4 px-6">Price (BDT)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Batch / Assignment</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {codes.map((c) => {
                  const isAvailable = c.status === "AVAILABLE";
                  const isUsed = c.status === "USED";

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-emerald-400 font-black text-sm bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            {c.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(c.code)}
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Copy Code"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-300">{c.category.replace(/_/g, " ")}</span>
                      </td>

                      <td className="py-4 px-6">
                        {c.category === "STUDENT_QUOTA_UPGRADE" ? (
                          <span className="inline-flex items-center gap-1 font-bold text-purple-300">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                            +{c.studentQuotaAdded || 100} Students ({c.quotaCredits} Credits)
                          </span>
                        ) : c.isLifetime ? (
                          <span className="font-bold text-purple-400">Lifetime Unlimited</span>
                        ) : (
                          <span className="text-slate-300">{c.validityYears} Year(s)</span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-amber-400">
                        {c.priceBdt.toLocaleString()} BDT
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isAvailable
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : isUsed
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : c.status === "ASSIGNED"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-400">
                        {c.redeemedClient ? (
                          <div>
                            <div className="text-slate-200 font-bold">Redeemed by: {c.redeemedClient.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(c.redeemedAt).toLocaleString()}
                            </div>
                          </div>
                        ) : c.assignedClient ? (
                          <div className="text-blue-300 font-semibold">
                            Assigned to: {c.assignedClient.name}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">
                            {c.batch?.batchNumber || "Standalone"}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => copyToClipboard(c.code)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                        >
                          {copiedCode === c.code ? "Copied!" : "Copy Key"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
