"use client";

import React from "react";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Smartphone,
  RefreshCw,
} from "lucide-react";

interface TotpSetupTabProps {
  admin: any;
  setupStep: "idle" | "qr" | "success";
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  otpVerifyInput: string;
  setOtpVerifyInput: (val: string) => void;
  copiedSecret: boolean;
  copiedBackup: boolean;
  loadingAction: boolean;
  showDisableModal: boolean;
  setShowDisableModal: (val: boolean) => void;
  disablePassword: string;
  setDisablePassword: (val: string) => void;
  disableOtp: string;
  setDisableOtp: (val: string) => void;
  onStart2FA: () => void;
  onConfirm2FA: (e: React.FormEvent) => void;
  onDisable2FA: (e: React.FormEvent) => void;
  onCancelSetup: () => void;
  onCopy: (text: string, type: "secret" | "backup") => void;
}

export function TotpSetupTab({
  admin,
  setupStep,
  secret,
  qrCodeUrl,
  backupCodes,
  otpVerifyInput,
  setOtpVerifyInput,
  copiedSecret,
  copiedBackup,
  loadingAction,
  showDisableModal,
  setShowDisableModal,
  disablePassword,
  setDisablePassword,
  disableOtp,
  setDisableOtp,
  onStart2FA,
  onConfirm2FA,
  onDisable2FA,
  onCancelSetup,
  onCopy,
}: TotpSetupTabProps) {
  return (
    <div className="space-y-6">
      {admin?.two_factor_enabled && setupStep !== "qr" && (
        <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  Two-Factor Authentication is Active
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your account requires a 6-digit TOTP code or SMS OTP on each login.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDisableModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              Disable 2FA
            </button>
          </div>

          {showDisableModal && (
            <form onSubmit={onDisable2FA} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-rose-300">
                Confirm Master Password to Disable 2FA:
              </div>
              <input
                type="password"
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Admin Master Password"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
              />
              <input
                type="text"
                value={disableOtp}
                onChange={(e) => setDisableOtp(e.target.value)}
                placeholder="Current 6-digit OTP (Optional)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loadingAction ? "Disabling..." : "Confirm Disable"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!admin?.two_factor_enabled && setupStep === "idle" && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Enable Time-based One-Time Password (TOTP)
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Protect the Vendor Licensing Controller by scanning a QR code with Google Authenticator, Authy, or Microsoft Authenticator.
            </p>
          </div>

          <button
            type="button"
            onClick={onStart2FA}
            disabled={loadingAction}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            {loadingAction ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Generating Secret...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Set Up Two-Factor Authentication
              </>
            )}
          </button>
        </div>
      )}

      {setupStep === "qr" && (
        <div className="space-y-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <span>Step 1</span> • <span>Scan QR Code in Authenticator App</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    className="w-36 h-36 object-contain"
                  />
                )}
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Scan with <strong>Google Authenticator</strong>,{" "}
                  <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong>.
                </p>
                <div>
                  <span className="text-slate-400 block mb-1">Or enter manual key:</span>
                  <div className="flex items-center gap-2">
                    <code className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-teal-300 font-mono text-xs font-bold select-all">
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => onCopy(secret, "secret")}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      title="Copy Secret"
                    >
                      {copiedSecret ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <span>Step 2</span> • <span>Emergency Recovery Codes</span>
              </div>
              <button
                type="button"
                onClick={() => onCopy(backupCodes.join("\n"), "backup")}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer"
              >
                {copiedBackup ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy All Codes
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-center font-bold"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={onConfirm2FA}
            className="bg-slate-950/70 border border-teal-500/30 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <span>Step 3</span> • <span>Verify Setup Code</span>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                Enter 6-digit code currently shown on Authenticator app:
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpVerifyInput}
                onChange={(e) => setOtpVerifyInput(e.target.value)}
                placeholder="123456"
                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-teal-300 font-mono text-center tracking-widest text-lg font-bold focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onCancelSetup}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingAction || !otpVerifyInput}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loadingAction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Activate 2FA
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
