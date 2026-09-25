"use client";

import { useEffect, useState, useCallback } from "react";

export function useLedger() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalBilledBdt: 0,
    totalPaidBdt: 0,
    totalOutstandingDuesBdt: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClientId !== "ALL") params.append("clientId", selectedClientId);
      if (selectedType !== "ALL") params.append("type", selectedType);

      const res = await fetch(`/api/ledger?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load ledger:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, selectedType]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const recordTransaction = async (formData: any) => {
    const res = await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      await fetchLedger();
    }
    return data;
  };

  return {
    transactions,
    summary,
    loading,
    selectedClientId,
    setSelectedClientId,
    selectedType,
    setSelectedType,
    recordTransaction,
    refetch: fetchLedger,
  };
}
