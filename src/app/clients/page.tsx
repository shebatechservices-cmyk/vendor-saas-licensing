"use client";

import { useState } from "react";
import { Users, PlusCircle } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { ClientDetailsModal } from "@/components/ClientDetailsModal";
import { ClientFilterBar } from "@/components/clients/ClientFilterBar";
import { ClientTable } from "@/components/clients/ClientTable";
import { AddClientModal } from "@/components/clients/AddClientModal";

export default function ClientsPage() {
  const {
    clients,
    loading,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    togglingId,
    toggleClientStatus,
    createClient,
    refetch,
  } = useClients("ALL");

  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    domain: "",
    appType: "Madrasa/School Management App",
    initialStudentQuota: 200,
    storageQuotaGb: 5.0,
    licenseYears: 1,
    isLifetime: false,
  });

  const handleToggle = async (clientId: string, currentStatus: string) => {
    const res = await toggleClientStatus(clientId, currentStatus);
    if (res.success && selectedClient && selectedClient.id === clientId) {
      setSelectedClient({ ...selectedClient, status: res.client.status });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await createClient(formData);
    if (data.success) {
      setShowAddModal(false);
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        domain: "",
        appType: "Madrasa/School Management App",
        initialStudentQuota: 200,
        storageQuotaGb: 5.0,
        licenseYears: 1,
        isLifetime: false,
      });
    } else {
      alert(data.error || "Failed to create client");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Client Subscriptions & Killswitch Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor client app instances, inspect heartbeats, track expiration dates, and control live active/blocked states.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Register New Client App
        </button>
      </div>

      {/* Filter and Search Bar */}
      <ClientFilterBar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Clients Table */}
      <ClientTable
        clients={clients}
        togglingId={togglingId}
        onToggleStatus={handleToggle}
        onSelectClient={setSelectedClient}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreate}
      />

      {/* Client Deep Details Modal */}
      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onToggleStatus={handleToggle}
        />
      )}
    </div>
  );
}
