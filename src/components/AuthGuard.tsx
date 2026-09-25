"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Globe,
  Smartphone,
  MessageSquare,
  Key,
  CheckCircle2,
  Send,
} from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const {
    admin,
    loading,
    step,
    error,
    clientIp,
    phoneMasked,
    login,
    verify2FA,
    sendSmsOtp,
    clearError,
    cancel2FAStep,
    refreshUser,
  } = useAuth();

  const [email, setEmail] = useState("admin@vendor.com");
  const [password, setPassword] = useState("Admin@123456");
  
  // 2FA Method Selector: 'totp' | 'sms' | 'backup'
  const [twoFactorMethod, setTwoFactorMethod] = useState<"totp" | "sms" | "backup">("totp");
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // SMS Resend Cooldown
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);
  const [smsStatusMessage, setSmsStatusMessage] = useState<string | null>(null);

  // Handle SMS countdown timer
  useEffect(() => {
    let timer: any;
    if (smsCooldown > 0) {
      timer = setInterval(() => {
        setSmsCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [smsCooldown]);

  // When switching to SMS mode for the first time, auto-trigger SMS if not in cooldown
  const handleSelectSmsMode = async () => {
    setTwoFactorMethod("sms");
    setOtpCode("");
    clearError();
    if (smsCooldown === 0 && !smsStatusMessage) {
      await handleSendSms();
    }
  };

  const handleSendSms = async () => {
    if (smsCooldown > 0 || smsSending) return;
    setSmsSending(true);
    setSmsStatusMessage(null);
    clearError();
    const res = await sendSmsOtp();
    setSmsSending(false);
    if (res.success) {
      setSmsStatusMessage(res.message || "SMS OTP dispatched successfully.");
      setSmsCooldown(60); // 60 seconds cooldown
    }
  };

  // While checking existing session token
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center animate-pulse shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <p className="text-slate-400 font-mono text-sm">Verifying 3-Layer Authentication...</p>
        </div>
      </div>
    );
  }

  // If already authenticated with full token, show children
  if (step === "authenticated" && admin) {
    return <>{children}</>;
  }

  // Handle Step 1: Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  // Handle Step 2: 2FA Verification (TOTP, SMS, or Backup Code)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setSubmitting(true);

    if (twoFactorMethod === "backup") {
      await verify2FA("", "backup", otpCode);
    } else if (twoFactorMethod === "sms") {
      await verify2FA(otpCode, "sms");
    } else {
      await verify2FA(otpCode, "totp");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 px-4">
      <div className="max-w-md w-full">
        {/* Top Header & Security Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-xl shadow-teal-500/20 mb-4 border border-teal-400/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Vendor SaaS Control Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Remote Licensing & Quota Controller
          </p>

          {/* 3-Layer Security Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Layer 1: JWT & Password
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Layer 2: TOTP / SMS 2FA
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Layer 3: IP Guard
            </span>
          </div>
        </div>

        {/* 3FA IP BLOCK SCREEN */}
        {step === "blocked_ip" && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-200">Layer 3: Network Access Denied</h3>
                <p className="text-xs text-rose-300/80">IP Whitelist Protection Active</p>
              </div>
            </div>

            <p className="text-xs text-rose-200/90 leading-relaxed mb-4">
              {error || "Your IP address is not authorized to access this vendor admin console."}
            </p>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 font-mono text-xs mb-4">
              <div className="text-slate-400 text-[11px]">Your Detected IP:</div>
              <div className="text-rose-400 font-bold mt-0.5">{clientIp || "Checking..."}</div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  refreshUser();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Access
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: CREDENTIALS LOGIN FORM */}
        {step === "login" && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Admin Authentication
                </h2>
                <p className="text-xs text-slate-400">Step 1 of Multi-Factor Security</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Step 1/2
              </span>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vendor.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span>Continue to Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Detected IP:</span>
                <span className="font-mono text-slate-300">{clientIp || "127.0.0.1"}</span>
              </span>
              <span className="text-emerald-400 font-mono">TLS 1.3 / AES-256</span>
            </div>
          </div>
        )}

        {/* STEP 2: TWO-FACTOR AUTHENTICATION SCREEN (TOTP, SMS, OR BACKUP) */}
        {step === "totp" && (
          <div className="bg-slate-900/80 border border-teal-500/40 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Two-Factor Verification
                </h2>
                <p className="text-xs text-slate-400">Step 2: Choose verification method</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Step 2/2
              </span>
            </div>

            {/* 2FA Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorMethod("totp");
                  setOtpCode("");
                  clearError();
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  twoFactorMethod === "totp"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Authenticator</span>
              </button>

              <button
                type="button"
                onClick={handleSelectSmsMode}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  twoFactorMethod === "sms"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>SMS OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorMethod("backup");
                  setOtpCode("");
                  clearError();
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  twoFactorMethod === "backup"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Backup Code</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {smsStatusMessage && twoFactorMethod === "sms" && !error && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{smsStatusMessage}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {/* TOTP Form Section */}
              {twoFactorMethod === "totp" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Enter 6-Digit Authenticator App Code
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-2xl font-bold py-3 rounded-xl bg-slate-950/90 border border-teal-500/50 text-teal-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Open Google Authenticator, Microsoft Authenticator, or Authy.
                  </p>
                </div>
              )}

              {/* SMS OTP Form Section */}
              {twoFactorMethod === "sms" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Enter 6-Digit SMS Verification Code
                    </label>
                    <span className="text-[11px] font-mono text-teal-300">
                      {phoneMasked || "Registered Phone"}
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-2xl font-bold py-3 rounded-xl bg-slate-950/90 border border-teal-500/50 text-teal-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 transition-all font-mono"
                  />

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Didn't receive SMS?</span>
                    <button
                      type="button"
                      onClick={handleSendSms}
                      disabled={smsCooldown > 0 || smsSending}
                      className="text-teal-400 hover:text-teal-300 text-xs font-semibold disabled:opacity-50 flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      {smsSending
                        ? "Sending SMS..."
                        : smsCooldown > 0
                        ? `Resend in ${smsCooldown}s`
                        : "Resend SMS Code"}
                    </button>
                  </div>
                </div>
              )}

              {/* Emergency Backup Code Form Section */}
              {twoFactorMethod === "backup" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Enter 8-Character Recovery Backup Code
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={12}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                    placeholder="ABCD-1234"
                    className="w-full text-center tracking-widest text-xl font-bold py-3 rounded-xl bg-slate-950/90 border border-teal-500/50 text-teal-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Enter one of your saved emergency recovery codes.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={cancel2FAStep}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !otpCode}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying Token...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Enter Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
