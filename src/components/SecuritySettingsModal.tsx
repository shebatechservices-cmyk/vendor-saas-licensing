"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Smartphone,
  MessageSquare,
  Globe,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  Send,
  Phone,
} from "lucide-react";

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecuritySettingsModal({
  isOpen,
  onClose,
}: SecuritySettingsModalProps) {
  const {
    admin,
    clientIp,
    setup2FA,
    confirm2FA,
    disable2FA,
    updatePhone,
    sendSmsOtp,
    updateIpWhitelist,
    refreshUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"totp" | "sms" | "ip_whitelist">("totp");

  // TOTP Setup State
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "success">("idle");
  const [secret, setSecret] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpVerifyInput, setOtpVerifyInput] = useState<string>("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Disable 2FA State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableOtp, setDisableOtp] = useState("");

  // SMS 2FA State
  const [phoneInput, setPhoneInput] = useState("");
  const [preferredMethodInput, setPreferredMethodInput] = useState("totp");
  const [savingPhone, setSavingPhone] = useState(false);
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);

  // IP Whitelist State
  const [ipList, setIpList] = useState<string[]>([]);
  const [newIpInput, setNewIpInput] = useState("");
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [savingIp, setSavingIp] = useState(false);

  // Feedback State
  const [loadingAction, setLoadingAction] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (admin) {
      setPhoneInput(admin.phone || "+8801700000000");
      setPreferredMethodInput(admin.preferred_2fa_method || "totp");
      setIpWhitelistEnabled(admin.ip_whitelist_enabled || false);
      if (admin.allowed_ips) {
        setIpList(
          admin.allowed_ips
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        );
      } else {
        setIpList(["127.0.0.1", "::1", "localhost"]);
      }
    }
  }, [admin, isOpen]);

  if (!isOpen) return null;

  // Start 2FA Setup Flow
  const handleStart2FASetup = async () => {
    setLoadingAction(true);
    setFeedback(null);
    const res = await setup2FA();
    setLoadingAction(false);
    if (res.success && res.secret && res.qrCodeUrl) {
      setSecret(res.secret);
      setQrCodeUrl(res.qrCodeUrl);
      setBackupCodes(res.backupCodes || []);
      setSetupStep("qr");
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to start 2FA setup" });
    }
  };

  // Confirm 2FA Setup Flow
  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerifyInput) return;
    setLoadingAction(true);
    setFeedback(null);
    const res = await confirm2FA(otpVerifyInput, backupCodes);
    setLoadingAction(false);
    if (res.success) {
      setSetupStep("success");
      setFeedback({
        type: "success",
        message: "Two-Factor Authentication is now enabled successfully!",
      });
    } else {
      setFeedback({ type: "error", message: res.error || "Invalid OTP code" });
    }
  };

  // Disable 2FA Flow
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;
    setLoadingAction(true);
    setFeedback(null);
    const res = await disable2FA(disablePassword, disableOtp || undefined);
    setLoadingAction(false);
    if (res.success) {
      setShowDisableModal(false);
      setDisablePassword("");
      setDisableOtp("");
      setSetupStep("idle");
      setFeedback({ type: "success", message: "2FA has been disabled on this account." });
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to disable 2FA" });
    }
  };

  // Save Phone & SMS preferences
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    setFeedback(null);
    const res = await updatePhone(phoneInput, preferredMethodInput);
    setSavingPhone(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: "SMS Contact & Preferred 2FA method updated successfully.",
      });
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update phone settings" });
    }
  };

  // Test SMS OTP sending
  const handleTestSms = async () => {
    setLoadingAction(true);
    setTestSmsStatus(null);
    const res = await sendSmsOtp();
    setLoadingAction(false);
    if (res.success) {
      setTestSmsStatus(res.message || "Test SMS OTP dispatched successfully.");
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to send test SMS" });
    }
  };

  // Add IP to whitelist
  const handleAddIp = () => {
    if (!newIpInput.trim()) return;
    const clean = newIpInput.trim();
    if (!ipList.includes(clean)) {
      setIpList([...ipList, clean]);
    }
    setNewIpInput("");
  };

  // Remove IP from whitelist
  const handleRemoveIp = (ipToRemove: string) => {
    setIpList(ipList.filter((ip) => ip !== ipToRemove));
  };

  // Save IP Whitelist settings
  const handleSaveIpWhitelist = async () => {
    setSavingIp(true);
    setFeedback(null);
    const ipString = ipList.join(",");
    const res = await updateIpWhitelist(ipString, ipWhitelistEnabled);
    setSavingIp(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: "3FA IP Whitelisting rules saved successfully.",
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to update IP whitelist rules.",
      });
    }
  };

  const copyToClipboard = (text: string, type: "secret" | "backup") => {
    navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Multi-Factor Security Center</h2>
              <p className="text-xs text-slate-400">
                Configure TOTP Authenticator, SMS 2FA Gateway & 3FA IP Whitelisting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-950/40 gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("totp");
              setFeedback(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "totp"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Authenticator App (TOTP)</span>
            {admin?.two_factor_enabled ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OFF
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("sms");
              setFeedback(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "sms"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS OTP Gateway</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {admin?.phone_masked || "+880..."}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("ip_whitelist");
              setFeedback(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "ip_whitelist"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3FA (IP Guard)</span>
            {admin?.ip_whitelist_enabled ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                OFF
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Notification Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}
            >
              {feedback.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: TOTP AUTHENTICATOR APP */}
          {activeTab === "totp" && (
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
                    <form onSubmit={handleDisable2FA} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
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
                    onClick={handleStart2FASetup}
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
                              onClick={() => copyToClipboard(secret, "secret")}
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
                        onClick={() => copyToClipboard(backupCodes.join("\n"), "backup")}
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
                    onSubmit={handleConfirm2FA}
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
                        onClick={() => setSetupStep("idle")}
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
          )}

          {/* TAB 2: SMS 2FA GATEWAY */}
          {activeTab === "sms" && (
            <div className="space-y-6">
              <form onSubmit={handleSavePhone} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
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
                    onClick={handleTestSms}
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
          )}

          {/* TAB 3: IP WHITELISTING (3FA) */}
          {activeTab === "ip_whitelist" && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Layer 3: Network IP Whitelist Enforcement
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When enabled, only connections originating from allowed IP addresses can authenticate.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ipWhitelistEnabled}
                    onChange={(e) => setIpWhitelistEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="bg-slate-950/40 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="text-slate-400">Current Client IP:</span>
                  <code className="font-mono text-cyan-300 font-bold">{clientIp || "127.0.0.1"}</code>
                </div>

                {!ipList.includes(clientIp || "127.0.0.1") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (clientIp && !ipList.includes(clientIp)) {
                        setIpList([...ipList, clientIp]);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] transition-all cursor-pointer"
                  >
                    + Add My IP to Whitelist
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Allowed IP Addresses & Subnets (IPv4, IPv6, CIDR):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIpInput}
                    onChange={(e) => setNewIpInput(e.target.value)}
                    placeholder="e.g. 192.168.1.100, 10.0.0.0/24, 203.0.113.4"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddIp}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add IP
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-400">Active Authorized IP Addresses ({ipList.length})</div>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {ipList.map((ip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span className="text-slate-200">{ip}</span>
                        {ip === (clientIp || "127.0.0.1") && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-sans">
                            (Current Session)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIp(ip)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-all cursor-pointer"
                        title="Remove IP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveIpWhitelist}
                  disabled={savingIp}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingIp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving Rules...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Save IP Whitelist Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
