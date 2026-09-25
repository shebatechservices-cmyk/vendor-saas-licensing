"use client";

import { useState } from "react";
import {
  Users,
  PlusCircle,
  Search,
  Globe,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  X,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { ClientStatusBadge } from "@/components/ClientStatusBadge";
import { ClientDetailsModal } from "@/components/ClientDetailsModal";

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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Register New Client App
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {["ALL", "ACTIVE", "BLOCKED", "SUSPENDED", "EXPIRED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === status
                  ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, domain, client code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Client Info</th>
                <th className="py-4 px-6">Credentials / Domain</th>
                <th className="py-4 px-6">License Expiry</th>
                <th className="py-4 px-6">Student Quota</th>
                <th className="py-4 px-6">Financial Balance</th>
                <th className="py-4 px-6">Live Connectivity</th>
                <th className="py-4 px-6 text-right">Killswitch & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {clients.map((c) => {
                const isOnline = c.isOnline;
                const isBlocked = c.status === "BLOCKED" || c.status === "SUSPENDED";

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{c.contactPerson || "Admin"}</span>
                        {c.phone && <span>• {c.phone}</span>}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-mono text-emerald-400 font-bold">{c.clientCode}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>{c.domain || "Local / Dynamic"}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {c.isLifetime ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Lifetime
                        </span>
                      ) : c.licenseExpiresAt ? (
                        <div className="text-slate-300">
                          {new Date(c.licenseExpiresAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-500">Not set</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-white">{c.quotas?.usedStudents || 0}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-purple-400">{c.studentQuota}</span>
                        <span className="text-[10px] text-slate-500 font-normal uppercase">slots</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold">
                        {c.currentDueBdt > 0 ? (
                          <span className="text-rose-400">{c.currentDueBdt.toLocaleString()} BDT Due</span>
                        ) : (
                          <span className="text-emerald-400">Clear (0 BDT)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Billed: {(c.totalBilledBdt || 0).toLocaleString()} BDT
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-600"
                          }`}
                        />
                        <span className={isOnline ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                          {c.lastHeartbeatAt
                            ? new Date(c.lastHeartbeatAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Offline"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <ClientStatusBadge status={c.status} size="sm" />
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(c.id, c.status)}
                          disabled={togglingId === c.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 shadow-sm ${
                            !isBlocked
                              ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30"
                              : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {togglingId === c.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : !isBlocked ? (
                            <>
                              <Lock className="w-3 h-3 text-rose-400" />
                              <span>Block</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3 text-emerald-400" />
                              <span>Unblock</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedClient(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          title="Inspect Client & API Credentials"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Register New Client Application
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Institution / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sheba Model Academy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Director / IT Head"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+880 1711-xxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Domain URL</label>
                  <input
                    type="text"
                    placeholder="e.g. app.shebaerp.com"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="admin@shebaerp.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Initial Student Quota Slots
                  </label>
                  <input
                    type="number"
                    min="50"
                    value={formData.initialStudentQuota}
                    onChange={(e) =>
                      setFormData({ ...formData, initialStudentQuota: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Initial License Validity (Years)
                  </label>
                  <select
                    value={formData.isLifetime ? "LIFETIME" : formData.licenseYears}
                    onChange={(e) => {
                      if (e.target.value === "LIFETIME") {
                        setFormData({ ...formData, isLifetime: true });
                      } else {
                        setFormData({
                          ...formData,
                          isLifetime: false,
                          licenseYears: parseInt(e.target.value, 10),
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((y) => (
                      <option key={y} value={y}>
                        {y} Year(s) Validity
                      </option>
                    ))}
                    <option value="LIFETIME">Lifetime License</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
