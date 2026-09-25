"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  phone_masked?: string;
  two_factor_enabled: boolean;
  preferred_2fa_method?: string;
  ip_whitelist_enabled: boolean;
  allowed_ips?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export type AuthStep = "login" | "totp" | "authenticated" | "blocked_ip";

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  step: AuthStep;
  error: string | null;
  clientIp: string;
  tempToken: string | null;
  token: string | null;
  phoneMasked: string;
  hasPhone: boolean;
  hasTotp: boolean;
  preferred2faMethod: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; two_factor_required?: boolean }>;
  verify2FA: (otpCode: string, type?: "totp" | "sms" | "backup", backupCode?: string) => Promise<{ success: boolean; error?: string }>;
  sendSmsOtp: () => Promise<{ success: boolean; message?: string; masked_phone?: string; error?: string; simulated?: boolean }>;
  updatePhone: (phone: string, preferredMethod?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setup2FA: () => Promise<{ success: boolean; secret?: string; qrCodeUrl?: string; backupCodes?: string[]; error?: string }>;
  confirm2FA: (otpCode: string, backupCodes?: string[]) => Promise<{ success: boolean; error?: string }>;
  disable2FA: (password: string, otpCode?: string) => Promise<{ success: boolean; error?: string }>;
  updateIpWhitelist: (allowedIps: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  cancel2FAStep: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "vendor_admin_token";
const TEMP_TOKEN_KEY = "vendor_temp_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [step, setStep] = useState<AuthStep>("login");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState<string>("");
  const [phoneMasked, setPhoneMasked] = useState<string>("");
  const [hasPhone, setHasPhone] = useState<boolean>(false);
  const [hasTotp, setHasTotp] = useState<boolean>(false);
  const [preferred2faMethod, setPreferred2faMethod] = useState<string>("totp");

  const clearError = () => setError(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TEMP_TOKEN_KEY);
    setToken(null);
    setTempToken(null);
    setAdmin(null);
    setPhoneMasked("");
    setStep("login");
    setError(null);
  }, []);

  const cancel2FAStep = () => {
    localStorage.removeItem(TEMP_TOKEN_KEY);
    setTempToken(null);
    setStep("login");
    setError(null);
  };

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setLoading(false);
      setStep("login");
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdmin(data.admin);
        setToken(savedToken);
        setClientIp(data.clientIp || "");
        setPhoneMasked(data.admin.phone_masked || "");
        setStep("authenticated");
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 403) {
        setStep("blocked_ip");
        setError(data.message || data.error || "IP Address Blocked");
        if (data.clientIp) setClientIp(data.clientIp);
        return { success: false, error: data.message || data.error };
      }

      if (!res.ok || !data.success) {
        setError(data.error || "Login failed");
        return { success: false, error: data.error || "Login failed" };
      }

      if (data.clientIp) setClientIp(data.clientIp);

      if (data.two_factor_required) {
        setTempToken(data.temp_token);
        localStorage.setItem(TEMP_TOKEN_KEY, data.temp_token);
        setPhoneMasked(data.phone_masked || "");
        setHasPhone(data.has_phone || false);
        setHasTotp(data.has_totp || false);
        setPreferred2faMethod(data.preferred_2fa_method || "totp");
        setStep("totp");
        return { success: true, two_factor_required: true };
      }

      // No 2FA required -> Direct Login
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      setAdmin(data.admin);
      setPhoneMasked(data.admin?.phone_masked || "");
      setStep("authenticated");
      return { success: true, two_factor_required: false };
    } catch (err: any) {
      const msg = err.message || "Network error occurred";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const sendSmsOtp = async () => {
    setError(null);
    const activeTempToken = tempToken || localStorage.getItem(TEMP_TOKEN_KEY);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/auth/send-sms-otp", {
        method: "POST",
        headers,
        body: JSON.stringify({
          temp_token: activeTempToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send SMS OTP");
        return { success: false, error: data.error };
      }

      if (data.masked_phone) {
        setPhoneMasked(data.masked_phone);
      }

      return {
        success: true,
        message: data.message,
        masked_phone: data.masked_phone,
        simulated: data.simulated,
      };
    } catch (err: any) {
      const msg = err.message || "Network failure";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const verify2FA = async (
    otpCode: string,
    type: "totp" | "sms" | "backup" = "totp",
    backupCode?: string
  ) => {
    setError(null);
    const activeTempToken = tempToken || localStorage.getItem(TEMP_TOKEN_KEY);
    if (!activeTempToken) {
      setError("Session expired. Please restart login.");
      setStep("login");
      return { success: false, error: "Session expired" };
    }

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temp_token: activeTempToken,
          otp_code: otpCode ? otpCode.trim() : undefined,
          type,
          backup_code: backupCode ? backupCode.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid verification code");
        return { success: false, error: data.error };
      }

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.removeItem(TEMP_TOKEN_KEY);
      setTempToken(null);
      setAdmin(data.admin);
      setStep("authenticated");
      return { success: true };
    } catch (err: any) {
      const msg = err.message || "Verification failed";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const updatePhone = async (phone: string, preferredMethod: string = "totp") => {
    try {
      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, preferred_2fa_method: preferredMethod }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to update phone" };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const setup2FA = async () => {
    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to setup 2FA" };
      }
      return {
        success: true,
        secret: data.secret,
        qrCodeUrl: data.qrCodeUrl,
        backupCodes: data.backupCodes,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const confirm2FA = async (otpCode: string, backupCodes?: string[]) => {
    try {
      const res = await fetch("/api/auth/confirm-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp_code: otpCode, backup_codes: backupCodes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to confirm 2FA" };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const disable2FA = async (password: string, otpCode?: string) => {
    try {
      const res = await fetch("/api/auth/disable-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password, otp_code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to disable 2FA" };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const updateIpWhitelist = async (allowedIps: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/auth/ip-whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          allowed_ips: allowedIps,
          ip_whitelist_enabled: enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to update IP whitelist" };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        step,
        error,
        clientIp,
        tempToken,
        token,
        phoneMasked,
        hasPhone,
        hasTotp,
        preferred2faMethod,
        login,
        verify2FA,
        sendSmsOtp,
        updatePhone,
        logout,
        setup2FA,
        confirm2FA,
        disable2FA,
        updateIpWhitelist,
        refreshUser,
        clearError,
        cancel2FAStep,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
