"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Receipt,
  User,
  Calendar,
  Building,
  RefreshCw,
  X
} from "lucide-react";

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
      console.error("Error recording transaction:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-emerald-400" />
            <span>Client Ledger & Accounting Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized double-entry accounting tracking total billings, redeemed codes, payment collections, and outstanding dues.
          </p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Record Payment / Adjustment
        </button>
      </div>

      {/* Accounting Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Billed (Debits)</div>
            <div className="text-2xl font-black text-white mt-1">
              {(summary?.totalBilledBdt ?? 0).toLocaleString()} BDT
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Licenses & Quota Redemptions</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid (Credits)</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {(summary?.totalPaidBdt ?? 0).toLocaleString()} BDT
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cash, Bank & Mobile Payments</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Dues</div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {(summary?.totalOutstandingDuesBdt ?? 0).toLocaleString()} BDT
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Net Receivable from Clients</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Filter by Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="ALL">All Clients Statement</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clientCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Transaction Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="BILLING">Billings Only</option>
              <option value="REDEMPTION">Code Redemptions</option>
              <option value="PAYMENT">Payments Received</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 self-end md:self-auto">
          Showing <strong className="text-white">{transactions.length}</strong> ledger entries
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Client Institution</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Description & Ref</th>
                <th className="py-4 px-6 text-right">Debit (Billed)</th>
                <th className="py-4 px-6 text-right">Credit (Paid)</th>
                <th className="py-4 px-6 text-right">Running Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {transactions.map((t) => {
                const isPayment = t.transactionType === "PAYMENT";
                const isBilling = t.transactionType === "BILLING" || t.transactionType === "REDEMPTION";

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}{" "}
                      <span className="text-[10px] text-slate-500">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{t.client?.name}</div>
                      <div className="text-[11px] font-mono text-emerald-400">{t.client?.clientCode}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isPayment
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : t.transactionType === "REDEMPTION"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {t.transactionType}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-slate-200">{t.description}</div>
                      {t.paymentMethod && (
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>Method: {t.paymentMethod}</span>
                          {t.receiptNumber && <span>• Ref: {t.receiptNumber}</span>}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold text-rose-400">
                      {t.debitAmount > 0 ? `+${t.debitAmount.toLocaleString()} BDT` : "-"}
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                      {t.creditAmount > 0 ? `-${t.creditAmount.toLocaleString()} BDT` : "-"}
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold text-white">
                      {t.runningBalanceBdt.toLocaleString()} BDT
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment / Transaction Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Record Payment or Manual Adjustment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select a client institution...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientCode}) - Due: {c.currentDueBdt?.toLocaleString()} BDT
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Transaction Type</label>
                  <select
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="PAYMENT">Payment Received (- Credit)</option>
                    <option value="BILLING">Manual Billing (+ Debit)</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={formData.amountBdt}
                    onChange={(e) => setFormData({ ...formData, amountBdt: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="bKash">bKash Merchant</option>
                    <option value="Nagad">Nagad Direct</option>
                    <option value="Bank Transfer">Bank Transfer / EFT</option>
                    <option value="Cash">Cash Receipt</option>
                    <option value="Pre-paid Voucher">Pre-paid Code</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Receipt / Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRN-998822"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Payment for Annual License renewal"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
