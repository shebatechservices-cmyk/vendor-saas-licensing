"use client";

import { useEffect, useState } from "react";
import { KeyRound, Download } from "lucide-react";
import { calculateFromCredits, calculateLicensePrice } from "@/lib/quota-calc";
import { CodeGenerationForm } from "@/components/codes/CodeGenerationForm";
import { CodeVaultTable } from "@/components/codes/CodeVaultTable";

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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export CSV ({codes.length})
        </button>
      </div>

      {/* Code Generation Form */}
      <CodeGenerationForm
        category={category}
        setCategory={setCategory}
        validityYears={validityYears}
        setValidityYears={setValidityYears}
        isLifetime={isLifetime}
        setIsLifetime={setIsLifetime}
        quotaCredits={quotaCredits}
        setQuotaCredits={setQuotaCredits}
        quantity={quantity}
        setQuantity={setQuantity}
        batchName={batchName}
        setBatchName={setBatchName}
        assignedClientId={assignedClientId}
        setAssignedClientId={setAssignedClientId}
        clients={clients}
        generating={generating}
        quotaCalc={quotaCalc}
        unitPrice={unitPrice}
        totalBatchPrice={totalBatchPrice}
        onGenerate={handleGenerateCodes}
      />

      {/* Code Vault Table */}
      <CodeVaultTable
        codes={codes}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        copiedCode={copiedCode}
        onCopy={copyToClipboard}
      />
    </div>
  );
}
