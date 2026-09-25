"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck,
  Smartphone,
  MessageSquare,
  Globe,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { TotpSetupTab } from "./security/TotpSetupTab";
import { SmsSetupTab } from "./security/SmsSetupTab";
import { IpWhitelistTab } from "./security/IpWhitelistTab";

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

          {activeTab === "totp" && (
            <TotpSetupTab
              admin={admin}
              setupStep={setupStep}
              secret={secret}
              qrCodeUrl={qrCodeUrl}
              backupCodes={backupCodes}
              otpVerifyInput={otpVerifyInput}
              setOtpVerifyInput={setOtpVerifyInput}
              copiedSecret={copiedSecret}
              copiedBackup={copiedBackup}
              loadingAction={loadingAction}
              showDisableModal={showDisableModal}
              setShowDisableModal={setShowDisableModal}
              disablePassword={disablePassword}
              setDisablePassword={setDisablePassword}
              disableOtp={disableOtp}
              setDisableOtp={setDisableOtp}
              onStart2FA={handleStart2FASetup}
              onConfirm2FA={handleConfirm2FA}
              onDisable2FA={handleDisable2FA}
              onCancelSetup={() => setSetupStep("idle")}
              onCopy={copyToClipboard}
            />
          )}

          {activeTab === "sms" && (
            <SmsSetupTab
              phoneInput={phoneInput}
              setPhoneInput={setPhoneInput}
              preferredMethodInput={preferredMethodInput}
              setPreferredMethodInput={setPreferredMethodInput}
              savingPhone={savingPhone}
              loadingAction={loadingAction}
              testSmsStatus={testSmsStatus}
              onSavePhone={handleSavePhone}
              onTestSms={handleTestSms}
            />
          )}

          {activeTab === "ip_whitelist" && (
            <IpWhitelistTab
              clientIp={clientIp}
              ipList={ipList}
              newIpInput={newIpInput}
              setNewIpInput={setNewIpInput}
              ipWhitelistEnabled={ipWhitelistEnabled}
              setIpWhitelistEnabled={setIpWhitelistEnabled}
              savingIp={savingIp}
              onAddIp={handleAddIp}
              onRemoveIp={handleRemoveIp}
              onAddCurrentIp={() => {
                if (clientIp && !ipList.includes(clientIp)) {
                  setIpList([...ipList, clientIp]);
                }
              }}
              onSaveIpWhitelist={handleSaveIpWhitelist}
            />
          )}
        </div>
      </div>
    </div>
  );
}
