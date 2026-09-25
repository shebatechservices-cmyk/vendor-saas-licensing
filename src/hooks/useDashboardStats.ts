"use client";

import { useEffect, useState, useCallback } from "react";

export function useDashboardStats(pollIntervalMs: number = 15000) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setError(null);
      } else {
        setError(data.error || "Failed to load dashboard metrics");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchStats, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchStats, pollIntervalMs]);

  return { stats, loading, error, refetch: fetchStats };
}
