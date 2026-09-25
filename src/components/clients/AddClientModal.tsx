"use client";

import React from "react";
import { PlusCircle, X } from "lucide-react";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddClientModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: AddClientModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            Register New Client Application
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
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
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Register Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
