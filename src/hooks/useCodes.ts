"use client";

import { useEffect, useState, useCallback } from "react";

export function useCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== "ALL") params.append("category", filterCategory);
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/codes?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCodes(data.codes);
        setBatches(data.batches);
      }
    } catch (err) {
      console.error("Failed to fetch codes:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, searchQuery]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const generateBatch = async (payload: any) => {
    try {
      setGenerating(true);
      const res = await fetch("/api/codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCodes();
      }
      return data;
    } finally {
      setGenerating(false);
    }
  };

  return {
    codes,
    batches,
    loading,
    generating,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    generateBatch,
    refetch: fetchCodes,
  };
}
