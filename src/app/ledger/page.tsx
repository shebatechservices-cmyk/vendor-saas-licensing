"use client";

import { useEffect, useState } from "react";
import { BookOpen, PlusCircle } from "lucide-react";
import { LedgerSummaryCards } from "@/components/ledger/LedgerSummaryCards";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { AddLedgerEntryModal } from "@/components/ledger/AddLedgerEntryModal";

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalBilledBdt: 0,
    totalPaidBdt: 0,
    totalOutstandingDuesBdt: 0,
  });
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Manual payment / transaction form
  const [formData, setFormData] = useState({
    clientId: "",
    transactionType: "PAYMENT",
    amountBdt: "",
    description: "",
    paymentMethod: "bKash",
    receiptNumber: "",
  });

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClientId !== "ALL") params.append("clientId", selectedClientId);
      if (selectedType !== "ALL") params.append("type", selectedType);

      const [ledgerRes, clientsRes] = await Promise.all([
        fetch(`/api/ledger?${params.toString()}`),
        fetch("/api/clients"),
      ]);

      const ledgerData = await ledgerRes.json();
      const clientsData = await clientsRes.json();

      if (ledgerData.success) {
        setTransactions(ledgerData.transactions);
        setSummary(ledgerData.summary);
      }
      if (clientsData.success) {
        setClients(clientsData.clients);
      }
    } catch (err) {
      console.error("Failed to load ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedClientId, selectedType]);

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(false);
        setFormData({
          clientId: "",
          transactionType: "PAYMENT",
          amountBdt: "",
          description: "",
          paymentMethod: "bKash",
          receiptNumber: "",
        });
        await fetchLedger();
      } else {
        alert(data.error || "Failed to record transaction");
      }
    } catch (err) {
      console.error("Error creating ledger entry:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-emerald-400" />
            <span>Financial Ledger & Client Statements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete double-entry accounting ledger of all software billings, code redemptions, and manual payment receipts.
          </p>
        </div>

        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Record Client Payment / Credit
        </button>
      </div>

      {/* Summary KPI Cards */}
      <LedgerSummaryCards summary={summary} />

      {/* Ledger Table & Filters */}
      <LedgerTable
        transactions={transactions}
        clients={clients}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />

      {/* Manual Payment Entry Modal */}
      <AddLedgerEntryModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        clients={clients}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleRecordTransaction}
      />
    </div>
  );
}
