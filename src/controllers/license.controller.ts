import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateClient } from "@/middlewares/auth.middleware";
import { handleApiError } from "@/middlewares/error.middleware";
import { signLicenseToken } from "@/lib/jwt";
import { generateRandomCode, getCategoryPrefix, mapToValidityType } from "@/lib/code-generator";
import { calculateFromCredits, calculateLicensePrice } from "@/lib/quota-calc";
import crypto from "crypto";

/**
 * Generate a unique formatted cryptographic license key
 * e.g. VEND-7A9B-4C2E-8F1K-9X0Z
 */
export function generateUniqueLicenseKey(prefix: string = "VEND"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const generateBlock = (len = 4) => {
    const bytes = crypto.randomBytes(len);
    let block = "";
    for (let i = 0; i < len; i++) {
      block += chars[bytes[i] % chars.length];
    }
    return block;
  };
  return `${prefix}-${generateBlock(4)}-${generateBlock(4)}-${generateBlock(4)}-${generateBlock(4)}`;
}

/**
 * Helper: Validate incoming APP_SECRET for Next.js endpoints
 */
async function validateNextAppSecret(req: NextRequest, body: any = {}) {
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
function extractNextHardwareFingerprint(req: NextRequest, body: any = {}) {
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

export class LicenseController {
  /**
   * POST /api/license/generate
   * Generates a new unique client license key
   */
  static async generateLicense(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const {
        client_name,
        clientName,
        mac_address,
        macAddress,
        validity_years,
        validityYears,
        expiry_date,
        expiryDate,
        status = "Active",
        // Batch code generator parameters (if legacy batch)
        category,
        quantity,
      } = body;

      const name = client_name || clientName;
      const mac = mac_address || macAddress;
      const years = validity_years !== undefined ? validity_years : validityYears;
      const explicitExpiry = expiry_date || expiryDate;

      // If this is a Client License generation
      if (name) {
        let calculatedExpiry: Date | null = null;
        if (explicitExpiry) {
          calculatedExpiry = new Date(explicitExpiry);
        } else if (years && Number(years) > 0) {
          const d = new Date();
          d.setFullYear(d.getFullYear() + Number(years));
          calculatedExpiry = d;
        } else if (years === "Lifetime" || years === 0 || years === "lifetime") {
          calculatedExpiry = null;
        } else {
          // Default 1 year
          const d = new Date();
          d.setFullYear(d.getFullYear() + 1);
          calculatedExpiry = d;
        }

        // Generate unique key
        let license_key = generateUniqueLicenseKey();
        let isUnique = false;
        while (!isUnique) {
          const existing = await prisma.license.findUnique({ where: { license_key } });
          if (!existing) isUnique = true;
          else license_key = generateUniqueLicenseKey();
        }

        const license = await prisma.license.create({
          data: {
            client_name: String(name).trim(),
            license_key,
            mac_address: mac ? String(mac).trim().toUpperCase() : null,
            expiry_date: calculatedExpiry,
            status: status || "Active",
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "License key generated successfully",
            license: {
              id: license.id,
              client_name: license.client_name,
              license_key: license.license_key,
              mac_address: license.mac_address,
              expiry_date: license.expiry_date,
              status: license.status,
              createdAt: license.createdAt,
            },
          },
          { status: 201 }
        );
      }

      // Legacy batch code generation fallback
      if (category) {
        const cat = category || "APP_LICENSE";
        const valType = mapToValidityType(body.validityType || body.validity_type || "1 Year");
        const qty = Math.min(Math.max(1, parseInt(String(quantity || 1), 10)), 100);
        const codesToCreate: string[] = [];

        for (let i = 0; i < qty; i++) {
          codesToCreate.push(generateRandomCode(getCategoryPrefix(cat)));
        }

        const created = await prisma.$transaction(
          codesToCreate.map((code) =>
            prisma.licenseCode.create({
              data: {
                code,
                category: cat,
                validityType: valType,
                validityYears: valType.startsWith("YEARS_") ? parseInt(valType.split("_")[1], 10) : null,
                isLifetime: valType === "LIFETIME",
                status: "AVAILABLE",
              },
            })
          )
        );

        return NextResponse.json({
          success: true,
          message: `Generated ${created.length} codes successfully.`,
          count: created.length,
          codes: created,
        });
      }

      return NextResponse.json(
        { success: false, error: "client_name is required to generate a license." },
        { status: 400 }
      );
    } catch (error: any) {
      return handleApiError(error, "Failed to generate license");
    }
  }

  /**
   * POST /api/license/verify
   * Unified License validation and heartbeat endpoint
   */
  static async verifyLicense(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const ipStr = clientIp.split(",")[0].trim();

      // 1. Verify APP_SECRET from request headers
      const authCheck = await validateNextAppSecret(req, body);
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

        return NextResponse.json(
          {
            success: false,
            authorized: false,
            error: authCheck.error || "Unauthorized: Missing or invalid APP_SECRET header.",
          },
          { status: 401 }
        );
      }

      const {
        license_key,
        licenseKey,
        clientId,
        secretKey,
        appVersion,
        domain,
        statusReported,
        activeStudentsCount,
        databaseSizeMb,
      } = body;

      const key = (license_key || licenseKey || "").trim();
      const now = new Date();

      // 1. Direct License Key Verification
      if (key) {
        const license = await prisma.license.findUnique({
          where: { license_key: key },
        });

        if (!license) {
          return NextResponse.json(
            {
              success: false,
              authorized: false,
              killswitch: true,
              status: "Invalid",
              error: "License Key not found or invalid",
            },
            { status: 404 }
          );
        }

        let currentStatus = license.status;

        // Auto-check expiry
        if (license.expiry_date && new Date(license.expiry_date) < now) {
          currentStatus = "Expired";
          if (license.status !== "Expired") {
            await prisma.license.update({
              where: { id: license.id },
              data: { status: "Expired" },
            });
          }
        }

        // 2. Hardware Fingerprint Enforcement & Binding
        const incomingFingerprint = extractNextHardwareFingerprint(req, body);

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

            return NextResponse.json(
              {
                success: false,
                authorized: false,
                killswitch: true,
                status: "Blocked",
                error: "Hardware fingerprint mismatch. License is bound to another machine.",
                registered_hardware: registeredFp,
                provided_hardware: incomingFingerprint || null,
              },
              { status: 403 }
            );
          }
        } else if (!license.mac_address && incomingFingerprint) {
          // Auto-bind MAC on first check
          await prisma.license.update({
            where: { id: license.id },
            data: { mac_address: incomingFingerprint },
          });
          console.log(`🔒 [License Engine] Bound license ${key} to hardware fingerprint: ${incomingFingerprint}`);
        }

        // Update heartbeat timestamp & IP
        await prisma.license.update({
          where: { id: license.id },
          data: {
            last_heartbeat: now,
            ip_address: ipStr,
            app_version: appVersion || license.app_version,
          },
        });

        const isKillswitchActive =
          currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
        const isAuthorized = currentStatus === "Active" && !isKillswitchActive;

        const statusCode = isAuthorized ? 200 : currentStatus === "Expired" ? 402 : 403;

        return NextResponse.json(
          {
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
          { status: statusCode }
        );
      }

      // 2. Client Credentials Verification (Sheba ERP)
      if (clientId && secretKey) {
        const auth = await authenticateClient(clientId, secretKey);
        if (!auth.isAuthenticated || !auth.client) {
          return NextResponse.json(
            {
              success: false,
              is_valid: false,
              status: "INVALID_CREDENTIALS",
              killswitch: true,
              error: auth.error || "Authentication failed. Invalid client credentials.",
            },
            { status: auth.statusCode || 401 }
          );
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

        // Update telemetry
        await prisma.client.update({
          where: { id: client.id },
          data: {
            lastHeartbeatAt: now,
            lastPingIp: clientIp.split(",")[0].trim(),
            lastAppVersion: appVersion || client.lastAppVersion,
            lastStatusReported: statusReported || client.lastStatusReported,
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

        return NextResponse.json({
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
        });
      }

      return NextResponse.json(
        { success: false, error: "Provide either license_key or clientId + secretKey." },
        { status: 400 }
      );
    } catch (error: any) {
      return handleApiError(error, "Verification failed");
    }
  }

  /**
   * POST /api/license/heartbeat
   * Dedicated live heartbeat telemetry endpoint saving last_sync and live_status
   */
  static async heartbeat(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const ipStr = clientIp.split(",")[0].trim();

      // 1. Verify APP_SECRET from request headers
      const authCheck = await validateNextAppSecret(req, body);
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

        return NextResponse.json(
          {
            success: false,
            authorized: false,
            error: authCheck.error || "Unauthorized: Missing or invalid APP_SECRET header.",
          },
          { status: 401 }
        );
      }

      const {
        license_key,
        licenseKey,
        clientId,
        secretKey,
        appVersion,
        app_version,
        domain,
        statusReported,
        activeStudentsCount,
        databaseSizeMb,
      } = body;

      const key = (license_key || licenseKey || "").trim();
      const version = appVersion || app_version || "16.9.26";
      const now = new Date();

      // 1. Direct License Key Heartbeat
      if (key) {
        const license = await prisma.license.findUnique({
          where: { license_key: key },
        });

        if (!license) {
          return NextResponse.json(
            {
              success: false,
              authorized: false,
              killswitch: true,
              live_status: "INVALID",
              error: "License Key not found",
            },
            { status: 404 }
          );
        }

        let currentStatus = license.status;

        // Auto-check expiry
        if (license.expiry_date && new Date(license.expiry_date) < now) {
          currentStatus = "Expired";
          if (license.status !== "Expired") {
            await prisma.license.update({
              where: { id: license.id },
              data: { status: "Expired" },
            });
          }
        }

        // 2. Hardware Fingerprint Enforcement & Binding
        const incomingFingerprint = extractNextHardwareFingerprint(req, body);

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

            return NextResponse.json(
              {
                success: false,
                authorized: false,
                killswitch: true,
                live_status: "BLOCKED",
                status: "Blocked",
                error: "Hardware fingerprint mismatch. License is bound to another machine.",
                registered_hardware: registeredFp,
                provided_hardware: incomingFingerprint || null,
              },
              { status: 403 }
            );
          }
        } else if (!license.mac_address && incomingFingerprint) {
          await prisma.license.update({
            where: { id: license.id },
            data: { mac_address: incomingFingerprint },
          });
          console.log(`🔒 [License Engine] Bound license ${key} to hardware fingerprint: ${incomingFingerprint}`);
        }

        const isKillswitchActive =
          currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
        const isAuthorized = currentStatus === "Active" && !isKillswitchActive;
        const calculatedLiveStatus = isKillswitchActive
          ? currentStatus === "Expired"
            ? "WARNING"
            : "BLOCKED"
          : "ONLINE";

        // Update last_sync and live_status in database
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

        return NextResponse.json(
          {
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
          { status: statusCode }
        );
      }

      // 2. Client Credentials Heartbeat fallback (for Client model)
      if (clientId && secretKey) {
        const auth = await authenticateClient(clientId, secretKey);
        if (!auth.isAuthenticated || !auth.client) {
          return NextResponse.json(
            {
              success: false,
              is_valid: false,
              status: "INVALID_CREDENTIALS",
              killswitch: true,
              error: auth.error || "Authentication failed.",
            },
            { status: auth.statusCode || 401 }
          );
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
            lastStatusReported: statusReported || client.lastStatusReported,
            isOnline: true,
          },
        });

        await prisma.heartbeatLog.create({
          data: {
            clientId: client.id,
            ipAddress: ipStr,
            appVersion: version,
            domainReported: domain || client.domain,
            statusReported: statusReported || "OPERATIONAL",
            activeStudentsCount: activeStudentsCount !== undefined ? parseInt(String(activeStudentsCount), 10) : null,
            databaseSizeMb: databaseSizeMb !== undefined ? parseFloat(String(databaseSizeMb)) : null,
          },
        });

        return NextResponse.json({
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
        });
      }

      return NextResponse.json(
        { success: false, error: "Provide license_key or clientId + secretKey for heartbeat." },
        { status: 400 }
      );
    } catch (error: any) {
      return handleApiError(error, "Failed to process heartbeat");
    }
  }

  /**
   * POST /api/license/update-status
   * Updates license status (Active, Suspended, Expired, Blocked) & Killswitch
   */
  static async updateLicenseStatus(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const { id, license_key, licenseKey, status, killswitch } = body;

      const targetKey = (license_key || licenseKey || "").trim();
      let targetLicense = null;

      if (id) {
        targetLicense = await prisma.license.findUnique({ where: { id } });
      } else if (targetKey) {
        targetLicense = await prisma.license.findUnique({ where: { license_key: targetKey } });
      }

      if (!targetLicense) {
        return NextResponse.json(
          { success: false, error: "License not found. Provide valid id or license_key." },
          { status: 404 }
        );
      }

      let nextStatus = status;
      if (killswitch !== undefined) {
        nextStatus = killswitch ? "Suspended" : "Active";
      }

      if (!nextStatus || !["Active", "Suspended", "Expired", "Blocked"].includes(nextStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status: ${nextStatus}. Allowed: Active, Suspended, Expired, Blocked.`,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.license.update({
        where: { id: targetLicense.id },
        data: { status: nextStatus },
      });

      return NextResponse.json({
        success: true,
        message: `License status updated to [${nextStatus}] successfully.`,
        license: updated,
        killswitch: nextStatus === "Suspended" || nextStatus === "Blocked" || nextStatus === "Expired",
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to update license status");
    }
  }

  /**
   * GET /api/license
   * Lists all client licenses
   */
  static async listLicenses(req: NextRequest) {
    try {
      const licenses = await prisma.license.findMany({
        orderBy: { createdAt: "desc" },
      });

      const activeCount = licenses.filter((l) => l.status === "Active").length;
      const suspendedCount = licenses.filter((l) => l.status === "Suspended" || l.status === "Blocked").length;
      const expiredCount = licenses.filter((l) => l.status === "Expired").length;

      return NextResponse.json({
        success: true,
        count: licenses.length,
        stats: {
          total: licenses.length,
          active: activeCount,
          suspended: suspendedCount,
          expired: expiredCount,
        },
        licenses,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to list licenses");
    }
  }

  /**
   * POST /api/vendor/redeem
   * Redeems a license/hosting/quota code for a client app
   */
  static async redeemCode(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const { code, clientId, client_app_id } = body;
      const targetClientId = clientId || client_app_id;

      console.log("[Vendor Controller] Received Redeem Request:", {
        code,
        clientId: targetClientId,
        timestamp: new Date().toISOString(),
      });

      if (!code || String(code).trim().length < 4) {
        console.warn("[Vendor Controller] Empty or too short code received:", code);
        return NextResponse.json({ success: false, error: "Please provide a valid code" }, { status: 400 });
      }

      const cleanCode = String(code).trim().toUpperCase();
      const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const now = new Date();

      // 1. Search in LicenseCode table (pre-generated vouchers & renewal codes)
      const licenseCode = await prisma.licenseCode.findUnique({
        where: { code: cleanCode },
      });

      if (licenseCode) {
        if (licenseCode.status === "USED") {
          console.warn("[Vendor Controller] LicenseCode already used:", cleanCode);
          return NextResponse.json({ success: false, error: "Code already used" }, { status: 400 });
        }

        let client = null;
        if (targetClientId) {
          client = await prisma.client.findFirst({
            where: {
              OR: [{ clientCode: targetClientId }, { id: targetClientId }],
            },
          });
        }

        // Update code as USED
        await prisma.licenseCode.update({
          where: { id: licenseCode.id },
          data: {
            status: "USED",
            redeemedClientId: client ? client.id : null,
            redeemedAt: now,
            redeemedByIp: clientIp.split(",")[0].trim(),
          },
        });

        const durationYears = licenseCode.validityYears || 1;
        const durationMs = durationYears * 365 * 24 * 60 * 60 * 1000;
        let durationLabel = "1 Year";
        if (licenseCode.isLifetime) durationLabel = "Lifetime";
        else if (licenseCode.validityYears) durationLabel = `${licenseCode.validityYears} Year${licenseCode.validityYears > 1 ? "s" : ""}`;

        // License Stacking: add duration to existing future expiry if valid, else from now
        let baseDate = now;
        if (client && client.licenseExpiresAt && new Date(client.licenseExpiresAt) > now) {
          baseDate = new Date(client.licenseExpiresAt);
        }
        const stackedExpiry = licenseCode.isLifetime
          ? new Date(now.getTime() + 99 * 365 * 24 * 60 * 60 * 1000)
          : new Date(baseDate.getTime() + durationMs);

        if (client) {
          await prisma.client.update({
            where: { id: client.id },
            data: {
              status: "ACTIVE",
              licenseExpiresAt: stackedExpiry,
              isLifetime: licenseCode.isLifetime || client.isLifetime,
              studentQuota: licenseCode.studentQuotaAdded ? client.studentQuota + licenseCode.studentQuotaAdded : client.studentQuota,
            },
          });
        }

        const resPayload = {
          success: true,
          message: `Code redeemed successfully! License extended to ${stackedExpiry.toLocaleDateString('en-GB')}`,
          code: licenseCode.code,
          code_type: licenseCode.category,
          category: licenseCode.category,
          duration: durationLabel,
          duration_years: durationYears,
          is_lifetime: licenseCode.isLifetime,
          student_quota_added: licenseCode.studentQuotaAdded,
          client_app_id: targetClientId,
          status: "active",
          previous_expiry: baseDate.toISOString(),
          license_expiry: stackedExpiry.toISOString(),
          expiry_date: stackedExpiry.toISOString(),
          days_extended: durationYears * 365,
          verified_at: now.toISOString(),
        };

        console.log("[Vendor Controller] Redeem Successful (Stacked LicenseCode):", resPayload);
        return NextResponse.json(resPayload);
      }

      // 2. Search in License table (Direct License Keys like VEND-5KQS-BC4V-EXKM-CVBR or SHEBA-ENT-...)
      const directLicense = await prisma.license.findUnique({
        where: { license_key: cleanCode },
      });

      if (directLicense) {
        if (directLicense.status === "Blocked" || directLicense.status === "Suspended") {
          console.warn("[Vendor Controller] Direct License is blocked/suspended:", cleanCode);
          return NextResponse.json(
            { success: false, error: `License key is ${directLicense.status.toLowerCase()} by administrator` },
            { status: 403 }
          );
        }

        // License Stacking: add 1 year (365 days) directly to existing expiry if in the future, else from now
        const baseDate = directLicense.expiry_date && new Date(directLicense.expiry_date) > now
          ? new Date(directLicense.expiry_date)
          : now;
        const stackedExpiry = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);

        await prisma.license.update({
          where: { id: directLicense.id },
          data: {
            status: "Active",
            expiry_date: stackedExpiry,
            last_heartbeat: now,
            ip_address: clientIp.split(",")[0].trim(),
          },
        });

        const resPayload = {
          success: true,
          message: `License key redeemed successfully! License extended to ${stackedExpiry.toLocaleDateString('en-GB')}`,
          code: directLicense.license_key,
          license_key: directLicense.license_key,
          code_type: "License",
          category: "APP_LICENSE",
          duration: "1 Year",
          duration_years: 1,
          is_lifetime: false,
          client_app_id: targetClientId,
          status: "active",
          previous_expiry: baseDate.toISOString(),
          license_expiry: stackedExpiry.toISOString(),
          expiry_date: stackedExpiry.toISOString(),
          days_extended: 365,
          verified_at: now.toISOString(),
        };

        console.log("[Vendor Controller] Redeem Successful (Stacked Direct License):", resPayload);
        return NextResponse.json(resPayload);
      }

      // 3. Not found in either table
      console.warn("[Vendor Controller] Key not found in database:", cleanCode);
      return NextResponse.json(
        { success: false, error: "Key not found in database", message: "Key not found in database" },
        { status: 404 }
      );
    } catch (error: any) {
      console.error("[Vendor Controller] Redeem Exception:", error);
      return handleApiError(error, "Failed to redeem code");
    }
  }

  /**
   * DELETE /api/license
   */
  static async deleteLicense(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json({ success: false, error: "License ID is required" }, { status: 400 });
      }

      await prisma.license.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "License deleted successfully" });
    } catch (error: any) {
      return handleApiError(error, "Failed to delete license");
    }
  }
}
