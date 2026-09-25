"use client";

import React from "react";
import { PlusCircle, X } from "lucide-react";

interface AddLedgerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  formData: any;
  setFormData: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddLedgerEntryModal({
  isOpen,
  onClose,
  clients,
  formData,
  setFormData,
  onSubmit,
}: AddLedgerEntryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            Record Payment / Credit Adjustment
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
              Select Client Application *
            </label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
            >
              <option value="">-- Choose Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clientCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Transaction Type
              </label>
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                <option value="PAYMENT">Client Payment (Credit)</option>
                <option value="ADJUSTMENT">Fee Adjustment / Discount</option>
                <option value="BILLING">Manual Invoice (Debit)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Amount (BDT) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 15000"
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
                <option value="Nagad">Nagad</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Prepaid Code">Prepaid License Code</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Receipt / Trx ID
              </label>
              <input
                type="text"
                placeholder="e.g. TRX-99214A"
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
              required
              placeholder="e.g. Payment for 1-Year Madrasa License & 500 Credits"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
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
              Record Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
