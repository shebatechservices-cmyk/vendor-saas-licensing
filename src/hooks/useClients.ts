"use client";

import { useEffect, useState, useCallback } from "react";

export function useClients(initialStatus: string = "ALL") {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/clients?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const toggleClientStatus = async (clientId: string, currentStatus: string, explicitTarget?: string) => {
    try {
      setTogglingId(clientId);
      let targetStatus = explicitTarget;
      if (!targetStatus) {
        targetStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
      }

      const res = await fetch(`/api/clients/${clientId}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchClients();
        return { success: true, client: data.client };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setTogglingId(null);
    }
  };

  const extendTrial = async (clientId: string, days: number = 7) => {
    try {
      setTogglingId(clientId);
      const res = await fetch(`/api/clients/${clientId}/extend-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        return { success: true, message: data.message, client: data.client };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setTogglingId(null);
    }
  };

  const renewLicense = async (clientId: string, years: number = 1, isLifetime: boolean = false) => {
    try {
      setTogglingId(clientId);
      const res = await fetch(`/api/clients/${clientId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ years, isLifetime }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        return { success: true, message: data.message, client: data.client };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setTogglingId(null);
    }
  };

  const forceBlock = async (clientId: string, reason?: string) => {
    try {
      setTogglingId(clientId);
      const res = await fetch(`/api/clients/${clientId}/force-block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        return { success: true, message: data.message, client: data.client };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setTogglingId(null);
    }
  };

  const createClient = async (formData: any) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      await fetchClients();
    }
    return data;
  };

  return {
    clients,
    loading,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    togglingId,
    toggleClientStatus,
    extendTrial,
    renewLicense,
    forceBlock,
    createClient,
    refetch: fetchClients,
  };
}
