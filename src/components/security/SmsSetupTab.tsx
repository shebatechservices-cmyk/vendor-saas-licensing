"use client";

import React from "react";
import { Phone, Send, Check } from "lucide-react";

interface SmsSetupTabProps {
  phoneInput: string;
  setPhoneInput: (val: string) => void;
  preferredMethodInput: string;
  setPreferredMethodInput: (val: string) => void;
  savingPhone: boolean;
  loadingAction: boolean;
  testSmsStatus: string | null;
  onSavePhone: (e: React.FormEvent) => void;
  onTestSms: () => void;
}

export function SmsSetupTab({
  phoneInput,
  setPhoneInput,
  preferredMethodInput,
  setPreferredMethodInput,
  savingPhone,
  loadingAction,
  testSmsStatus,
  onSavePhone,
  onTestSms,
}: SmsSetupTabProps) {
  return (
    <div className="space-y-6">
      <form onSubmit={onSavePhone} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-teal-400" />
            Security Contact Phone Number
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            SMS OTP verification codes will be dispatched to this mobile phone number.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Mobile Phone Number (with Country Code)
          </label>
          <input
            type="tel"
            required
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="+8801700000000"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Preferred Default 2FA Method
          </label>
          <select
            value={preferredMethodInput}
            onChange={(e) => setPreferredMethodInput(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="totp">Authenticator App (Google Authenticator / TOTP)</option>
            <option value="sms">SMS OTP Verification</option>
          </select>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onTestSms}
            disabled={loadingAction}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test SMS OTP
          </button>

          <button
            type="submit"
            disabled={savingPhone}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {savingPhone ? "Saving..." : "Save Phone Settings"}
          </button>
        </div>
      </form>

      {testSmsStatus && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{testSmsStatus}</span>
        </div>
      )}
    </div>
  );
}
