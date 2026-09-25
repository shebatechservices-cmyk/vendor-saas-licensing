import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { handleApiError, handleSuccess } from "@/middlewares/error.middleware";
import { extractClientIp, isIpAuthorized, normalizeIp } from "@/middlewares/ip-whitelist.middleware";
import {
  generateTotpSetup,
  verifyTotpToken,
  hashPassword,
  comparePassword,
} from "@/lib/totp";
import {
  sendOtpSMS,
  generateNumericOtp,
  maskPhoneNumber,
  normalizePhoneNumber,
} from "@/utils/smsService";

const JWT_SECRET = process.env.JWT_SECRET || "vendor_saas_jwt_secret_key_prod_2026_x89a@!#";

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: "ADMIN";
  is2FAVerified: boolean;
  ipVerified: boolean;
  loginIp: string;
}

export class AuthController {
  /**
   * Ensure default admin exists
   */
  static async ensureDefaultAdmin() {
    const existing = await prisma.adminUser.findFirst();
    if (!existing) {
      const defaultPasswordHash = await hashPassword("Admin@123456");
      return prisma.adminUser.create({
        data: {
          email: "admin@vendor.com",
          name: "Vendor Master Administrator",
          passwordHash: defaultPasswordHash,
          two_factor_enabled: false,
          phone: "+8801700000000",
          phone_verified: true,
          preferred_2fa_method: "totp",
          allowed_ips: "127.0.0.1,::1,localhost",
          ip_whitelist_enabled: false,
        },
      });
    }
    return existing;
  }

  /**
   * POST /api/auth/login
   * Step 1 of Multi-Factor Authentication: Credentials + 3FA IP Check
   */
  static async login(req: NextRequest) {
    try {
      await AuthController.ensureDefaultAdmin();
      const body = await req.json().catch(() => ({}));
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: "Email and password are required." },
          { status: 400 }
        );
      }

      const clientIp = extractClientIp(req);

      // Find admin user
      const admin = await prisma.adminUser.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Invalid admin email or password." },
          { status: 401 }
        );
      }

      // 3rd Verification Layer: IP Whitelisting Check
      if (admin.ip_whitelist_enabled) {
        const isAuthorized = isIpAuthorized(clientIp, admin.allowed_ips);
        if (!isAuthorized) {
          return NextResponse.json(
            {
              success: false,
              error: "3FA Network Access Denied",
              message: `Your IP address [${clientIp}] is not in the authorized network whitelist for this admin account.`,
              clientIp,
            },
            { status: 403 }
          );
        }
      }

      // Verify Password
      const isPasswordValid = await comparePassword(password, admin.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Invalid admin email or password." },
          { status: 401 }
        );
      }

      // Check if 2FA is enabled
      if (admin.two_factor_enabled && (admin.two_factor_secret || admin.phone)) {
        // Issue short-lived temporary token for 2FA verification step
        const tempToken = jwt.sign(
          {
            id: admin.id,
            email: admin.email,
            twoFactorPending: true,
            clientIp,
          },
          JWT_SECRET,
          { expiresIn: "5m", issuer: "Vendor-License-Controller" }
        );

        return NextResponse.json({
          success: true,
          two_factor_required: true,
          temp_token: tempToken,
          message: "Step 1 passed. Please verify your identity using Authenticator App (TOTP) or SMS OTP.",
          clientIp,
          phone_masked: maskPhoneNumber(admin.phone || ""),
          has_phone: !!admin.phone,
          has_totp: !!admin.two_factor_secret,
          preferred_2fa_method: admin.preferred_2fa_method || "totp",
        });
      }

      // If 2FA is not enabled, issue full session token directly
      const sessionToken = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "ADMIN",
          is2FAVerified: false,
          ipVerified: true,
          loginIp: clientIp,
        },
        JWT_SECRET,
        { expiresIn: "1d", issuer: "Vendor-License-Controller" }
      );

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        two_factor_required: false,
        token: sessionToken,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          phone: admin.phone,
          phone_masked: maskPhoneNumber(admin.phone || ""),
          two_factor_enabled: false,
          ip_whitelist_enabled: admin.ip_whitelist_enabled,
        },
        clientIp,
      });
    } catch (error: any) {
      return handleApiError(error, "Login failed");
    }
  }

  /**
   * POST /api/auth/send-sms-otp
   * Generates and dispatches a 6-digit SMS OTP to admin's phone number
   */
  static async sendSmsOtp(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const { temp_token } = body;

      let adminId: string | null = null;

      // Check if temporary token from login flow
      if (temp_token) {
        try {
          const decoded: any = jwt.verify(temp_token, JWT_SECRET, {
            issuer: "Vendor-License-Controller",
          });
          adminId = decoded.id;
        } catch {
          return NextResponse.json(
            { success: false, error: "2FA session expired. Please restart login." },
            { status: 401 }
          );
        }
      } else {
        // Or check authenticated admin session
        const authAdmin = await AuthController.getAuthenticatedAdmin(req);
        if (authAdmin) {
          adminId = authAdmin.id;
        }
      }

      if (!adminId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized. Session token is required." },
          { status: 401 }
        );
      }

      const admin = await prisma.adminUser.findUnique({
        where: { id: adminId },
      });

      if (!admin || !admin.phone) {
        return NextResponse.json(
          { success: false, error: "No verified phone number configured for this admin account." },
          { status: 400 }
        );
      }

      // Generate 6-digit numeric OTP
      const otpCode = generateNumericOtp(6);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      // Store OTP in database
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          sms_otp_code: otpCode,
          sms_otp_expires_at: expiresAt,
        },
      });

      // Send via SMS Gateway
      const smsResult = await sendOtpSMS(admin.phone, otpCode, "Vendor SaaS");

      if (!smsResult.success) {
        return NextResponse.json(
          { success: false, error: smsResult.error || "Failed to dispatch SMS OTP" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${maskPhoneNumber(admin.phone)}.`,
        masked_phone: maskPhoneNumber(admin.phone),
        expires_at: expiresAt.toISOString(),
        simulated: smsResult.simulated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to send SMS OTP");
    }
  }

  /**
   * POST /api/auth/verify-2fa
   * Step 2 of Multi-Factor Authentication: Validate TOTP, SMS OTP, or Backup Code
   */
  static async verify2FA(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const { temp_token, otp_code, type, backup_code } = body;

      if (!temp_token) {
        return NextResponse.json(
          { success: false, error: "Session expired. Please log in again." },
          { status: 400 }
        );
      }

      if (!otp_code && !backup_code) {
        return NextResponse.json(
          { success: false, error: "Verification code is required." },
          { status: 400 }
        );
      }

      // Verify temp token
      let decoded: any;
      try {
        decoded = jwt.verify(temp_token, JWT_SECRET, {
          issuer: "Vendor-License-Controller",
        });
      } catch (err) {
        return NextResponse.json(
          { success: false, error: "2FA session expired. Please restart login." },
          { status: 401 }
        );
      }

      const admin = await prisma.adminUser.findUnique({
        where: { id: decoded.id },
      });

      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Admin user not found." },
          { status: 404 }
        );
      }

      const clientIp = extractClientIp(req);
      const cleanOtp = String(otp_code || "").replace(/\s+/g, "").trim();
      let isCodeValid = false;
      let verificationMethod = "TOTP";

      // 1. Check SMS OTP
      if (
        (type === "sms" || !type) &&
        admin.sms_otp_code &&
        admin.sms_otp_expires_at &&
        new Date() <= new Date(admin.sms_otp_expires_at)
      ) {
        if (cleanOtp === admin.sms_otp_code) {
          isCodeValid = true;
          verificationMethod = "SMS";
          // Clear consumed SMS OTP
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: {
              sms_otp_code: null,
              sms_otp_expires_at: null,
            },
          });
        }
      }

      // 2. Check TOTP Authenticator App Code
      if (!isCodeValid && (type === "totp" || !type) && admin.two_factor_secret) {
        const isValidTotp = verifyTotpToken(cleanOtp, admin.two_factor_secret);
        if (isValidTotp) {
          isCodeValid = true;
          verificationMethod = "TOTP";
        }
      }

      // 3. Check Backup Recovery Codes
      if (!isCodeValid && (type === "backup" || backup_code || cleanOtp) && admin.backup_codes) {
        const candidateBackup = (backup_code ? String(backup_code) : cleanOtp).trim().toUpperCase();
        const storedCodes: string[] = JSON.parse(admin.backup_codes || "[]");
        if (storedCodes.includes(candidateBackup)) {
          isCodeValid = true;
          verificationMethod = "BACKUP_CODE";
          // Consume the used backup code
          const remaining = storedCodes.filter((c) => c !== candidateBackup);
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: { backup_codes: JSON.stringify(remaining) },
          });
        }
      }

      if (!isCodeValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid verification code. Please check your Authenticator App, SMS inbox, or Backup code and try again.",
          },
          { status: 400 }
        );
      }

      // Issue full verified Admin Session Token with is2FAVerified: true
      const sessionToken = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "ADMIN",
          is2FAVerified: true,
          ipVerified: true,
          loginIp: clientIp,
          method: verificationMethod,
        },
        JWT_SECRET,
        { expiresIn: "1d", issuer: "Vendor-License-Controller" }
      );

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        message: `2FA verification (${verificationMethod}) successful. Access granted.`,
        token: sessionToken,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          phone: admin.phone,
          phone_masked: maskPhoneNumber(admin.phone || ""),
          two_factor_enabled: true,
          preferred_2fa_method: admin.preferred_2fa_method || "totp",
          ip_whitelist_enabled: admin.ip_whitelist_enabled,
        },
        clientIp,
      });
    } catch (error: any) {
      return handleApiError(error, "2FA verification failed");
    }
  }

  /**
   * POST /api/auth/setup-2fa
   * Generates new TOTP secret & QR code
   */
  static async setup2FA(req: NextRequest) {
    try {
      const admin = await AuthController.getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const setup = await generateTotpSetup(admin.email, "Vendor SaaS Licensing");

      // Save temporary secret
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          two_factor_temp_secret: setup.secret,
        },
      });

      return NextResponse.json({
        success: true,
        secret: setup.secret,
        qrCodeUrl: setup.qrCodeDataUrl,
        backupCodes: setup.backupCodes,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to initiate 2FA setup");
    }
  }

  /**
   * POST /api/auth/confirm-2fa
   * Confirms initial OTP code to officially enable 2FA
   */
  static async confirm2FA(req: NextRequest) {
    try {
      const admin = await AuthController.getAuthenticatedAdmin(req);
      if (!admin || !admin.two_factor_temp_secret) {
        return NextResponse.json(
          { success: false, error: "No pending 2FA setup found. Please restart setup." },
          { status: 400 }
        );
      }

      const body = await req.json().catch(() => ({}));
      const { otp_code, backup_codes } = body;

      if (!otp_code) {
        return NextResponse.json(
          { success: false, error: "6-digit OTP code is required to verify setup." },
          { status: 400 }
        );
      }

      const isValid = verifyTotpToken(String(otp_code), admin.two_factor_temp_secret);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP code. Please enter the current code from your Authenticator app." },
          { status: 400 }
        );
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          two_factor_enabled: true,
          two_factor_secret: admin.two_factor_temp_secret,
          two_factor_temp_secret: null,
          backup_codes: backup_codes ? JSON.stringify(backup_codes) : admin.backup_codes,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Two-Factor Authentication (2FA) is now enabled and active on your account!",
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to confirm 2FA");
    }
  }

  /**
   * POST /api/auth/disable-2fa
   */
  static async disable2FA(req: NextRequest) {
    try {
      const admin = await AuthController.getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const body = await req.json().catch(() => ({}));
      const { password, otp_code } = body;

      const isPasswordValid = await comparePassword(password || "", admin.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Incorrect password." },
          { status: 400 }
        );
      }

      if (admin.two_factor_secret && otp_code) {
        const isValidOtp = verifyTotpToken(String(otp_code), admin.two_factor_secret);
        if (!isValidOtp) {
          return NextResponse.json(
            { success: false, error: "Invalid OTP code." },
            { status: 400 }
          );
        }
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_temp_secret: null,
          backup_codes: null,
          sms_otp_code: null,
          sms_otp_expires_at: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Two-Factor Authentication has been disabled.",
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to disable 2FA");
    }
  }

  /**
   * POST /api/auth/phone
   * Updates admin phone number and preferred 2FA method
   */
  static async updatePhone(req: NextRequest) {
    try {
      const admin = await AuthController.getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const body = await req.json().catch(() => ({}));
      const { phone, preferred_2fa_method } = body;

      const normalized = phone ? normalizePhoneNumber(phone) : admin.phone;

      const updated = await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          phone: normalized,
          preferred_2fa_method: preferred_2fa_method || admin.preferred_2fa_method,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Security contact phone number updated successfully.",
        phone: updated.phone,
        phone_masked: maskPhoneNumber(updated.phone || ""),
        preferred_2fa_method: updated.preferred_2fa_method,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to update phone number");
    }
  }

  /**
   * GET / POST /api/auth/ip-whitelist
   * Manages 3rd layer IP whitelisting
   */
  static async manageIpWhitelist(req: NextRequest) {
    try {
      const admin = await AuthController.getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const currentClientIp = extractClientIp(req);

      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { allowed_ips, ip_whitelist_enabled } = body;

        const updated = await prisma.adminUser.update({
          where: { id: admin.id },
          data: {
            allowed_ips: allowed_ips !== undefined ? allowed_ips : admin.allowed_ips,
            ip_whitelist_enabled:
              ip_whitelist_enabled !== undefined ? !!ip_whitelist_enabled : admin.ip_whitelist_enabled,
          },
        });

        return NextResponse.json({
          success: true,
          message: "IP Whitelist security configuration updated successfully.",
          allowed_ips: updated.allowed_ips,
          ip_whitelist_enabled: updated.ip_whitelist_enabled,
          currentClientIp,
        });
      }

      return NextResponse.json({
        success: true,
        allowed_ips: admin.allowed_ips,
        ip_whitelist_enabled: admin.ip_whitelist_enabled,
        currentClientIp,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to manage IP whitelist");
    }
  }

  /**
   * GET /api/auth/me
   * Fetches current admin user profile
   */
  static async getMe(req: NextRequest) {
    try {
      const admin = await AuthController.getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized session" },
          { status: 401 }
        );
      }

      const clientIp = extractClientIp(req);

      return NextResponse.json({
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          phone: admin.phone,
          phone_masked: maskPhoneNumber(admin.phone || ""),
          two_factor_enabled: admin.two_factor_enabled,
          preferred_2fa_method: admin.preferred_2fa_method,
          ip_whitelist_enabled: admin.ip_whitelist_enabled,
          allowed_ips: admin.allowed_ips,
          lastLoginAt: admin.lastLoginAt,
          lastLoginIp: admin.lastLoginIp,
        },
        clientIp,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to retrieve user profile");
    }
  }

  /**
   * Helper: Get currently authenticated admin from Bearer token
   */
  static async getAuthenticatedAdmin(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET, {
        issuer: "Vendor-License-Controller",
      });
      if (!decoded || !decoded.id) return null;

      return prisma.adminUser.findUnique({
        where: { id: decoded.id },
      });
    } catch {
      return null;
    }
  }
}
