import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateClient } from "@/middlewares/auth.middleware";
import { signLicenseToken } from "@/lib/jwt";

export interface VerificationRequestParams {
  license_key?: string;
  licenseKey?: string;
  clientId?: string;
  clientCode?: string;
  secretKey?: string;
  appVersion?: string;
  app_version?: string;
  domain?: string;
  statusReported?: string;
  activeStudentsCount?: number | string;
  databaseSizeMb?: number | string;
  ip_address?: string;
}

export class LicenseVerificationService {
  /**
   * Helper: Validate incoming APP_SECRET for Next.js endpoints
   */
  static async validateAppSecret(req: NextRequest, body: any = {}) {
    const headers = req.headers;
    const incomingSecret =
      headers.get("x-app-secret") ||
      headers.get("X-App-Secret") ||
      headers.get("x-secret-key") ||
      headers.get("X-Secret-Key") ||
      (headers.get("authorization")?.startsWith("Bearer ")
        ? headers.get("authorization")?.substring(7).trim()
        : null) ||
      body.app_secret ||
      body.appSecret ||
      body.secretKey ||
      body.secret_key;

    if (!incomingSecret) {
      return {
        valid: false,
        error: "Missing APP_SECRET in request headers (X-App-Secret). Access denied.",
      };
    }

    const validAppSecret = process.env.APP_SECRET || "sheba_vendor_app_secret_2026_x89a";
    const fallbackClientSecret = "sec_sheba_tech_enterprise_2026_vendor_auth";

    if (incomingSecret === validAppSecret || incomingSecret === fallbackClientSecret) {
      return { valid: true };
    }

    try {
      const client = await prisma.client.findFirst({
        where: { secretKey: incomingSecret },
      });
      if (client) {
        return { valid: true, client };
      }
    } catch (_) {}

    return {
      valid: false,
      error: "Invalid APP_SECRET provided. Request is not genuinely from an authorized client application.",
    };
  }

  /**
   * Helper: Extract Hardware Fingerprint from NextRequest or body
   */
  static extractHardwareFingerprint(req: NextRequest, body: any = {}) {
    const headers = req.headers;
    const fp =
      headers.get("x-hardware-fingerprint") ||
      headers.get("X-Hardware-Fingerprint") ||
      headers.get("x-mac-address") ||
      headers.get("X-MAC-Address") ||
      headers.get("x-device-id") ||
      headers.get("X-Device-ID") ||
      body.hardware_fingerprint ||
      body.hardwareFingerprint ||
      body.mac_address ||
      body.macAddress ||
      body.deviceId ||
      body.device_id ||
      body.hardware_id;

    return fp ? String(fp).trim().toUpperCase() : null;
  }

  /**
   * Verifies a license key or client application credentials
   */
  static async verify(req: NextRequest, body: VerificationRequestParams) {
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipStr = clientIp.split(",")[0].trim();

    // 1. Verify APP_SECRET
    const authCheck = await this.validateAppSecret(req, body);
    if (!authCheck.valid) {
      await prisma.securityAlert.create({
        data: {
          type: "UNAUTHORIZED_REQUEST",
          severity: "HIGH",
          title: "Unauthorized Client Request",
          description: `License verification rejected: ${authCheck.error}`,
          ipAddress: ipStr,
        },
      }).catch(() => null);

      return {
        unauthorized: true,
        statusCode: 401,
        payload: {
          success: false,
          authorized: false,
          error: authCheck.error || "Unauthorized: Missing or invalid APP_SECRET header.",
        },
      };
    }

    const key = (body.license_key || body.licenseKey || "").trim();
    const now = new Date();

    // 2. Direct License Key Verification
    if (key) {
      const license = await prisma.license.findUnique({
        where: { license_key: key },
      });

      if (!license) {
        return {
          statusCode: 404,
          payload: {
            success: false,
            authorized: false,
            killswitch: true,
            status: "Invalid",
            error: "License Key not found or invalid",
          },
        };
      }

      let currentStatus = license.status;

      // Check Expiry
      if (license.expiry_date && new Date(license.expiry_date) < now) {
        currentStatus = "Expired";
        if (license.status !== "Expired") {
          await prisma.license.update({
            where: { id: license.id },
            data: { status: "Expired" },
          });
        }
      }

      // Hardware Fingerprint Enforcement
      const incomingFingerprint = this.extractHardwareFingerprint(req, body);

      if (license.mac_address) {
        const registeredFp = license.mac_address.trim().toUpperCase();
        if (!incomingFingerprint || registeredFp !== incomingFingerprint) {
          await prisma.securityAlert.create({
            data: {
              type: "HARDWARE_MISMATCH",
              severity: "HIGH",
              title: "Hardware Fingerprint Mismatch",
              description: `Verification blocked for key ${key}. Bound device: ${registeredFp}, Incoming: ${incomingFingerprint || "NONE"}.`,
              clientCode: key,
              ipAddress: ipStr,
            },
          }).catch(() => null);

          return {
            statusCode: 403,
            payload: {
              success: false,
              authorized: false,
              killswitch: true,
              status: "Blocked",
              error: "Hardware fingerprint mismatch. License is bound to another machine.",
              registered_hardware: registeredFp,
              provided_hardware: incomingFingerprint || null,
            },
          };
        }
      } else if (!license.mac_address && incomingFingerprint) {
        await prisma.license.update({
          where: { id: license.id },
          data: { mac_address: incomingFingerprint },
        });
      }

      // Update Heartbeat
      await prisma.license.update({
        where: { id: license.id },
        data: {
          last_heartbeat: now,
          ip_address: ipStr,
          app_version: body.appVersion || body.app_version || license.app_version,
        },
      });

      const isKillswitchActive =
        currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
      const isAuthorized = currentStatus === "Active" && !isKillswitchActive;
      const statusCode = isAuthorized ? 200 : currentStatus === "Expired" ? 402 : 403;

      return {
        statusCode,
        payload: {
          success: true,
          authorized: isAuthorized,
          killswitch: isKillswitchActive,
          status: currentStatus,
          client_name: license.client_name,
          license_key: license.license_key,
          mac_address: license.mac_address || incomingFingerprint || null,
          expiry_date: license.expiry_date,
          last_heartbeat: now,
          message: isAuthorized
            ? "License active and authorized"
            : `License is ${currentStatus}. Access restricted.`,
        },
      };
    }

    // 3. Client Credentials Verification (Sheba ERP)
    const clientId = body.clientId || body.clientCode;
    const secretKey = body.secretKey;
    if (clientId && secretKey) {
      const auth = await authenticateClient(clientId, secretKey);
      if (!auth.isAuthenticated || !auth.client) {
        return {
          statusCode: auth.statusCode || 401,
          payload: {
            success: false,
            is_valid: false,
            status: "INVALID_CREDENTIALS",
            killswitch: true,
            error: auth.error || "Authentication failed. Invalid client credentials.",
          },
        };
      }

      const client = auth.client;
      let currentStatus = client.status;
      const isExpired = !client.isLifetime && client.licenseExpiresAt && client.licenseExpiresAt < now;
      if (isExpired && (currentStatus === "ACTIVE" || currentStatus === "PENDING")) {
        currentStatus = "EXPIRED";
        await prisma.client.update({
          where: { id: client.id },
          data: { status: "EXPIRED" },
        });
      }

      const isBlocked = currentStatus === "BLOCKED" || currentStatus === "SUSPENDED";
      const isKillswitchActive = isBlocked || isExpired;
      const isValid = currentStatus === "ACTIVE" && !isExpired;

      const directives = {
        status: currentStatus,
        killswitch: isKillswitchActive,
        is_blocked: isBlocked,
        is_expired: isExpired,
        student_quota: client.studentQuota,
        storage_quota_gb: client.storageQuotaGb,
        reason: isBlocked
          ? "Client application has been blocked by Vendor administration."
          : isExpired
          ? "License has expired. Please renew your subscription."
          : "License is active and valid.",
      };

      await prisma.client.update({
        where: { id: client.id },
        data: {
          lastHeartbeatAt: now,
          lastPingIp: ipStr,
          lastAppVersion: body.appVersion || body.app_version || client.lastAppVersion,
          lastStatusReported: body.statusReported || client.lastStatusReported,
          isOnline: true,
        },
      });

      const token = signLicenseToken({
        clientId: client.id,
        clientCode: client.clientCode,
        name: client.name,
        domain: client.domain,
        status: currentStatus as any,
        isLifetime: client.isLifetime,
        licenseExpiresAt: client.licenseExpiresAt ? client.licenseExpiresAt.toISOString() : null,
        hostingExpiresAt: client.hostingExpiresAt ? client.hostingExpiresAt.toISOString() : null,
        domainExpiresAt: client.domainExpiresAt ? client.domainExpiresAt.toISOString() : null,
        studentQuota: client.studentQuota,
        storageQuotaGb: client.storageQuotaGb,
        issuedAt: new Date().toISOString(),
      });

      return {
        statusCode: 200,
        payload: {
          success: true,
          is_valid: isValid,
          status: currentStatus,
          killswitch: isKillswitchActive,
          token,
          directives,
          client: {
            id: client.clientCode,
            name: client.name,
            status: currentStatus,
            isLifetime: client.isLifetime,
            licenseExpiresAt: client.licenseExpiresAt,
            hostingExpiresAt: client.hostingExpiresAt,
            domainExpiresAt: client.domainExpiresAt,
            studentQuota: client.studentQuota,
          },
        },
      };
    }

    return {
      statusCode: 400,
      payload: {
        success: false,
        error: "Provide either license_key or clientId + secretKey.",
      },
    };
  }

  /**
   * Processes a live heartbeat ping
   */
  static async processHeartbeat(req: NextRequest, body: VerificationRequestParams) {
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipStr = clientIp.split(",")[0].trim();

    // Verify APP_SECRET
    const authCheck = await this.validateAppSecret(req, body);
    if (!authCheck.valid) {
      await prisma.securityAlert.create({
        data: {
          type: "UNAUTHORIZED_REQUEST",
          severity: "HIGH",
          title: "Unauthorized Heartbeat Request",
          description: `Heartbeat rejected: ${authCheck.error}`,
          ipAddress: ipStr,
        },
      }).catch(() => null);

      return {
        statusCode: 401,
        payload: {
          success: false,
          authorized: false,
          error: authCheck.error || "Unauthorized: Missing or invalid APP_SECRET header.",
        },
      };
    }

    const key = (body.license_key || body.licenseKey || "").trim();
    const version = body.appVersion || body.app_version || "16.9.26";
    const now = new Date();

    // 1. Direct License Key Heartbeat
    if (key) {
      const license = await prisma.license.findUnique({
        where: { license_key: key },
      });

      if (!license) {
        return {
          statusCode: 404,
          payload: {
            success: false,
            authorized: false,
            killswitch: true,
            live_status: "INVALID",
            error: "License Key not found",
          },
        };
      }

      let currentStatus = license.status;

      if (license.expiry_date && new Date(license.expiry_date) < now) {
        currentStatus = "Expired";
        if (license.status !== "Expired") {
          await prisma.license.update({
            where: { id: license.id },
            data: { status: "Expired" },
          });
        }
      }

      const incomingFingerprint = this.extractHardwareFingerprint(req, body);

      if (license.mac_address) {
        const registeredFp = license.mac_address.trim().toUpperCase();
        if (!incomingFingerprint || registeredFp !== incomingFingerprint) {
          await prisma.securityAlert.create({
            data: {
              type: "HARDWARE_MISMATCH",
              severity: "HIGH",
              title: "Hardware Fingerprint Mismatch on Heartbeat",
              description: `Heartbeat rejected for key ${key}. Bound device: ${registeredFp}, Incoming: ${incomingFingerprint || "NONE"}.`,
              clientCode: key,
              ipAddress: ipStr,
            },
          }).catch(() => null);

          return {
            statusCode: 403,
            payload: {
              success: false,
              authorized: false,
              killswitch: true,
              live_status: "BLOCKED",
              status: "Blocked",
              error: "Hardware fingerprint mismatch. License is bound to another machine.",
              registered_hardware: registeredFp,
              provided_hardware: incomingFingerprint || null,
            },
          };
        }
      } else if (!license.mac_address && incomingFingerprint) {
        await prisma.license.update({
          where: { id: license.id },
          data: { mac_address: incomingFingerprint },
        });
      }

      const isKillswitchActive =
        currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
      const isAuthorized = currentStatus === "Active" && !isKillswitchActive;
      const calculatedLiveStatus = isKillswitchActive
        ? currentStatus === "Expired"
          ? "WARNING"
          : "BLOCKED"
        : "ONLINE";

      const updated = await prisma.license.update({
        where: { id: license.id },
        data: {
          last_sync: now,
          last_heartbeat: now,
          live_status: calculatedLiveStatus,
          ip_address: ipStr,
          app_version: version,
        },
      });

      const statusCode = isAuthorized ? 200 : currentStatus === "Expired" ? 402 : 403;

      return {
        statusCode,
        payload: {
          success: true,
          authorized: isAuthorized,
          killswitch: isKillswitchActive,
          status: currentStatus,
          live_status: calculatedLiveStatus,
          last_sync: now.toISOString(),
          client_name: updated.client_name,
          license_key: updated.license_key,
          mac_address: updated.mac_address || incomingFingerprint || null,
          expiry_date: updated.expiry_date,
          message: isAuthorized
            ? "Heartbeat acknowledged. Client live."
            : `License is ${currentStatus}. Access restricted.`,
        },
      };
    }

    // 2. Client Credentials Heartbeat
    const clientId = body.clientId || body.clientCode;
    const secretKey = body.secretKey;
    if (clientId && secretKey) {
      const auth = await authenticateClient(clientId, secretKey);
      if (!auth.isAuthenticated || !auth.client) {
        return {
          statusCode: auth.statusCode || 401,
          payload: {
            success: false,
            is_valid: false,
            status: "INVALID_CREDENTIALS",
            killswitch: true,
            error: auth.error || "Authentication failed.",
          },
        };
      }

      const client = auth.client;
      let currentStatus = client.status;
      const isExpired = !client.isLifetime && client.licenseExpiresAt && client.licenseExpiresAt < now;
      if (isExpired && (currentStatus === "ACTIVE" || currentStatus === "PENDING")) {
        currentStatus = "EXPIRED";
        await prisma.client.update({
          where: { id: client.id },
          data: { status: "EXPIRED" },
        });
      }

      const isBlocked = currentStatus === "BLOCKED" || currentStatus === "SUSPENDED";
      const isKillswitchActive = isBlocked || isExpired;
      const calculatedLiveStatus = isBlocked ? "BLOCKED" : isExpired ? "WARNING" : "ONLINE";

      await prisma.client.update({
        where: { id: client.id },
        data: {
          lastHeartbeatAt: now,
          last_sync: now,
          live_status: calculatedLiveStatus,
          lastPingIp: ipStr,
          lastAppVersion: version,
          lastStatusReported: body.statusReported || client.lastStatusReported,
          isOnline: true,
        },
      });

      await prisma.heartbeatLog.create({
        data: {
          clientId: client.id,
          ipAddress: ipStr,
          appVersion: version,
          domainReported: body.domain || client.domain,
          statusReported: body.statusReported || "OPERATIONAL",
          activeStudentsCount: body.activeStudentsCount !== undefined ? parseInt(String(body.activeStudentsCount), 10) : null,
          databaseSizeMb: body.databaseSizeMb !== undefined ? parseFloat(String(body.databaseSizeMb)) : null,
        },
      });

      return {
        statusCode: 200,
        payload: {
          success: true,
          authorized: !isKillswitchActive,
          killswitch: isKillswitchActive,
          status: currentStatus,
          live_status: calculatedLiveStatus,
          last_sync: now.toISOString(),
          client: {
            id: client.clientCode,
            name: client.name,
            status: currentStatus,
            studentQuota: client.studentQuota,
          },
        },
      };
    }

    return {
      statusCode: 400,
      payload: {
        success: false,
        error: "Provide license_key or clientId + secretKey for heartbeat.",
      },
    };
  }
}
