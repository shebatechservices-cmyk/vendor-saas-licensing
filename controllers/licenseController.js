/**
 * Modular Express License Controller for Vendor SaaS Engine
 * Provides: /generate, /verify, /heartbeat, /update-status, /redeem, /api/license
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

// ==========================================
// 1. HELPERS & SECURITY
// ==========================================

function generateUniqueLicenseKey(prefix = "SHEBA") {
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

async function validateAppSecret(req) {
  const headers = req.headers || {};
  const body = req.body || {};

  const incomingSecret =
    headers["x-app-secret"] ||
    headers["X-App-Secret"] ||
    headers["x-secret-key"] ||
    headers["X-Secret-Key"] ||
    (headers["authorization"] && headers["authorization"].startsWith("Bearer ")
      ? headers["authorization"].substring(7).trim()
      : null) ||
    body.app_secret ||
    body.appSecret ||
    body.secretKey ||
    body.secret_key;

  if (!incomingSecret) {
    return { valid: false, error: "Missing APP_SECRET in request headers (X-App-Secret). Access denied." };
  }

  const validAppSecret = process.env.APP_SECRET || "sheba_vendor_app_secret_2026_x89a";
  const fallbackClientSecret = "sec_sheba_tech_enterprise_2026_vendor_auth";

  if (incomingSecret === validAppSecret || incomingSecret === fallbackClientSecret) {
    return { valid: true };
  }

  try {
    const client = await prisma.client.findFirst({ where: { secretKey: incomingSecret } });
    if (client) return { valid: true, client };
  } catch (_) {}

  return { valid: false, error: "Invalid APP_SECRET provided." };
}

function extractHardwareFingerprint(req) {
  const headers = req.headers || {};
  const body = req.body || {};

  const fp =
    headers["x-hardware-fingerprint"] ||
    headers["X-Hardware-Fingerprint"] ||
    headers["x-mac-address"] ||
    headers["X-MAC-Address"] ||
    headers["x-device-id"] ||
    headers["X-Device-ID"] ||
    body.hardware_fingerprint ||
    body.hardwareFingerprint ||
    body.mac_address ||
    body.macAddress ||
    body.deviceId ||
    body.device_id ||
    body.hardware_id;

  return fp ? String(fp).trim().toUpperCase() : null;
}

// ==========================================
// 2. CONTROLLER HANDLERS
// ==========================================

async function generate(req, res) {
  try {
    const body = req.body || {};
    const { client_name, mac_address, validity_years, expiry_date, status = "Active" } = body;

    if (!client_name || !client_name.trim()) {
      const err = { success: false, error: "client_name is required" };
      return res.status ? res.status(400).json(err) : err;
    }

    let calculatedExpiry = null;
    if (expiry_date) {
      calculatedExpiry = new Date(expiry_date);
    } else if (validity_years && Number(validity_years) > 0) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + Number(validity_years));
      calculatedExpiry = d;
    } else if (validity_years === "Lifetime" || validity_years === 0) {
      calculatedExpiry = null;
    } else {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      calculatedExpiry = d;
    }

    let license_key = generateUniqueLicenseKey();
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.license.findUnique({ where: { license_key } });
      if (!existing) isUnique = true;
      else license_key = generateUniqueLicenseKey();
    }

    const license = await prisma.license.create({
      data: {
        client_name: client_name.trim(),
        license_key,
        mac_address: mac_address ? mac_address.trim().toUpperCase() : null,
        expiry_date: calculatedExpiry,
        status: status || "Active",
      },
    });

    const responseData = {
      success: true,
      message: "License generated successfully",
      license,
    };
    return res.status ? res.status(201).json(responseData) : responseData;
  } catch (error) {
    const err = { success: false, error: error.message || "Failed to generate license" };
    return res.status ? res.status(500).json(err) : err;
  }
}

async function verify(req, res) {
  try {
    const clientIp = (req.headers && req.headers["x-forwarded-for"]) || req.socket?.remoteAddress || "127.0.0.1";
    const ipStr = String(clientIp).split(",")[0].trim();

    const authCheck = await validateAppSecret(req);
    if (!authCheck.valid) {
      await prisma.securityAlert.create({
        data: {
          type: "UNAUTHORIZED_REQUEST",
          severity: "HIGH",
          title: "Unauthorized Client Request",
          description: `License verify rejected: ${authCheck.error}`,
          ipAddress: ipStr,
        },
      }).catch(() => null);

      const unauth = { success: false, authorized: false, error: authCheck.error };
      return res.status ? res.status(401).json(unauth) : unauth;
    }

    const body = req.body || {};
    const key = (body.license_key || body.licenseKey || "").trim();

    if (!key) {
      const err = { success: false, authorized: false, error: "license_key is required" };
      return res.status ? res.status(400).json(err) : err;
    }

    const license = await prisma.license.findUnique({ where: { license_key: key } });
    if (!license) {
      const notFound = { success: false, authorized: false, killswitch: true, status: "Invalid", error: "License Key not found" };
      return res.status ? res.status(404).json(notFound) : notFound;
    }

    const now = new Date();
    let currentStatus = license.status;

    if (license.expiry_date && new Date(license.expiry_date) < now) {
      currentStatus = "Expired";
      if (license.status !== "Expired") {
        await prisma.license.update({ where: { id: license.id }, data: { status: "Expired" } });
      }
    }

    const incomingFingerprint = extractHardwareFingerprint(req);
    if (license.mac_address) {
      const registeredFp = license.mac_address.trim().toUpperCase();
      if (!incomingFingerprint || registeredFp !== incomingFingerprint) {
        await prisma.securityAlert.create({
          data: {
            type: "HARDWARE_MISMATCH",
            severity: "HIGH",
            title: "Hardware Fingerprint Mismatch",
            description: `Verification blocked for key ${key}.`,
            clientCode: key,
            ipAddress: ipStr,
          },
        }).catch(() => null);

        const macMismatch = { success: false, authorized: false, killswitch: true, status: "Blocked", error: "Hardware fingerprint mismatch" };
        return res.status ? res.status(403).json(macMismatch) : macMismatch;
      }
    } else if (!license.mac_address && incomingFingerprint) {
      await prisma.license.update({ where: { id: license.id }, data: { mac_address: incomingFingerprint } });
    }

    await prisma.license.update({
      where: { id: license.id },
      data: { last_heartbeat: now, ip_address: ipStr, app_version: body.app_version || license.app_version },
    });

    const isKillswitchActive = currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
    const isAuthorized = currentStatus === "Active" && !isKillswitchActive;

    const result = {
      success: true,
      authorized: isAuthorized,
      killswitch: isKillswitchActive,
      status: currentStatus,
      client_name: license.client_name,
      license_key: license.license_key,
      mac_address: license.mac_address || incomingFingerprint || null,
      expiry_date: license.expiry_date,
      last_heartbeat: now,
      message: isAuthorized ? "License active and authorized" : `License is ${currentStatus}. Access restricted.`,
    };

    if (res.status) {
      const code = isAuthorized ? 200 : currentStatus === "Expired" ? 402 : 403;
      return res.status(code).json(result);
    }
    return result;
  } catch (error) {
    const err = { success: false, authorized: false, error: error.message || "Verification failed" };
    return res.status ? res.status(500).json(err) : err;
  }
}

async function heartbeat(req, res) {
  try {
    const clientIp = (req.headers && req.headers["x-forwarded-for"]) || req.socket?.remoteAddress || "127.0.0.1";
    const ipStr = String(clientIp).split(",")[0].trim();

    const authCheck = await validateAppSecret(req);
    if (!authCheck.valid) {
      const unauth = { success: false, authorized: false, error: authCheck.error };
      return res.status ? res.status(401).json(unauth) : unauth;
    }

    const body = req.body || {};
    const key = (body.license_key || body.licenseKey || "").trim();
    if (!key) {
      const err = { success: false, error: "license_key is required for heartbeat" };
      return res.status ? res.status(400).json(err) : err;
    }

    const license = await prisma.license.findUnique({ where: { license_key: key } });
    if (!license) {
      const notFound = { success: false, authorized: false, killswitch: true, live_status: "INVALID", error: "License Key not found" };
      return res.status ? res.status(404).json(notFound) : notFound;
    }

    const now = new Date();
    let currentStatus = license.status;

    if (license.expiry_date && new Date(license.expiry_date) < now) {
      currentStatus = "Expired";
      if (license.status !== "Expired") {
        await prisma.license.update({ where: { id: license.id }, data: { status: "Expired" } });
      }
    }

    const incomingFingerprint = extractHardwareFingerprint(req);
    if (license.mac_address) {
      const registeredFp = license.mac_address.trim().toUpperCase();
      if (!incomingFingerprint || registeredFp !== incomingFingerprint) {
        const mismatch = { success: false, authorized: false, killswitch: true, live_status: "BLOCKED", status: "Blocked", error: "Hardware fingerprint mismatch" };
        return res.status ? res.status(403).json(mismatch) : mismatch;
      }
    } else if (!license.mac_address && incomingFingerprint) {
      await prisma.license.update({ where: { id: license.id }, data: { mac_address: incomingFingerprint } });
    }

    const isKillswitchActive = currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
    const isAuthorized = currentStatus === "Active" && !isKillswitchActive;
    const calculatedLiveStatus = isKillswitchActive ? (currentStatus === "Expired" ? "WARNING" : "BLOCKED") : "ONLINE";

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        last_sync: now,
        last_heartbeat: now,
        live_status: calculatedLiveStatus,
        ip_address: ipStr,
        app_version: body.app_version || license.app_version,
      },
    });

    const responsePayload = {
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
      message: isAuthorized ? "Heartbeat acknowledged. Client is live." : `Client is ${currentStatus}.`,
    };

    if (res.status) {
      const statusCode = isAuthorized ? 200 : currentStatus === "Expired" ? 402 : 403;
      return res.status(statusCode).json(responsePayload);
    }
    return responsePayload;
  } catch (error) {
    const err = { success: false, error: error.message || "Failed to process heartbeat" };
    return res.status ? res.status(500).json(err) : err;
  }
}

async function redeemCode(req, res) {
  try {
    const body = req.body || {};
    const rawCode =
      body.code ||
      body.license_key ||
      body.licenseKey ||
      body.key ||
      body.activation_code ||
      body.activationCode ||
      body.token;
    const targetClientId = body.clientId || body.client_app_id || body.clientCode;

    if (!rawCode || String(rawCode).trim().length < 4) {
      return res.status(400).json({ success: false, error: "Please provide a valid code" });
    }

    const cleanCode = String(rawCode).trim().toUpperCase();
    const clientIp = ((req.headers && req.headers["x-forwarded-for"]) || req.socket?.remoteAddress || "127.0.0.1").split(",")[0].trim();
    const now = new Date();

    // 1. Search in LicenseCode table
    const licenseCode = await prisma.licenseCode.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { code: { equals: cleanCode, mode: "insensitive" } },
        ],
      },
    });

    if (licenseCode) {
      if (licenseCode.status === "USED") {
        return res.status(400).json({ success: false, error: "Code already used" });
      }

      let client = null;
      if (targetClientId) {
        client = await prisma.client.findFirst({
          where: { OR: [{ clientCode: targetClientId }, { id: targetClientId }] },
        });
      }

      await prisma.licenseCode.update({
        where: { id: licenseCode.id },
        data: {
          status: "USED",
          redeemedClientId: client ? client.id : null,
          redeemedAt: now,
          redeemedByIp: clientIp,
        },
      });

      const durationYears = licenseCode.validityYears || 1;
      const durationMs = durationYears * 365 * 24 * 60 * 60 * 1000;
      let durationLabel = "1 Year";
      if (licenseCode.isLifetime) durationLabel = "Lifetime";
      else if (licenseCode.validityYears) durationLabel = `${licenseCode.validityYears} Year${licenseCode.validityYears > 1 ? "s" : ""}`;

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
        message: `Code redeemed successfully! License extended to ${stackedExpiry.toLocaleDateString("en-GB")}`,
        code: licenseCode.code,
        category: licenseCode.category,
        duration: durationLabel,
        is_lifetime: licenseCode.isLifetime,
        status: "active",
        license_expiry: stackedExpiry.toISOString(),
      };
      return res.status ? res.status(200).json(resPayload) : resPayload;
    }

    // 2. Search in License table (Direct License Keys)
    const directLicense = await prisma.license.findFirst({
      where: {
        OR: [
          { license_key: cleanCode },
          { license_key: { equals: cleanCode, mode: "insensitive" } },
        ],
      },
    });

    if (directLicense) {
      if (directLicense.status === "Blocked" || directLicense.status === "Suspended") {
        const errPayload = { success: false, error: `License key is ${directLicense.status.toLowerCase()}` };
        return res.status ? res.status(403).json(errPayload) : errPayload;
      }

      const baseDate = directLicense.expiry_date && new Date(directLicense.expiry_date) > now
        ? new Date(directLicense.expiry_date)
        : now;
      const stackedExpiry = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      await prisma.license.update({
        where: { id: directLicense.id },
        data: { status: "Active", expiry_date: stackedExpiry, last_heartbeat: now, ip_address: clientIp },
      });

      const resPayload = {
        success: true,
        message: `License key redeemed successfully! License extended to ${stackedExpiry.toLocaleDateString("en-GB")}`,
        code: directLicense.license_key,
        license_key: directLicense.license_key,
        status: "active",
        license_expiry: stackedExpiry.toISOString(),
      };
      return res.status ? res.status(200).json(resPayload) : resPayload;
    }

    const notFoundPayload = { success: false, error: "Key not found in database" };
    return res.status ? res.status(404).json(notFoundPayload) : notFoundPayload;
  } catch (error) {
    const errPayload = { success: false, error: error.message || "Failed to redeem code" };
    return res.status ? res.status(500).json(errPayload) : errPayload;
  }
}

async function updateStatus(req, res) {
  try {
    const body = req.body || {};
    const { id, license_key, status, killswitch } = body;

    let target = null;
    if (id) target = await prisma.license.findUnique({ where: { id } });
    else if (license_key) target = await prisma.license.findUnique({ where: { license_key: license_key.trim() } });

    if (!target) {
      const err = { success: false, error: "License not found." };
      return res.status ? res.status(404).json(err) : err;
    }

    let nextStatus = status;
    if (killswitch !== undefined) nextStatus = killswitch ? "Suspended" : "Active";

    if (!nextStatus || !["Active", "Suspended", "Expired", "Blocked"].includes(nextStatus)) {
      const err = { success: false, error: `Invalid status: ${nextStatus}` };
      return res.status ? res.status(400).json(err) : err;
    }

    const updated = await prisma.license.update({ where: { id: target.id }, data: { status: nextStatus } });
    const payload = { success: true, message: `Status updated to [${nextStatus}]`, license: updated };
    return res.status ? res.status(200).json(payload) : payload;
  } catch (error) {
    const err = { success: false, error: error.message || "Failed to update status" };
    return res.status ? res.status(500).json(err) : err;
  }
}

async function listLicenses(req, res) {
  try {
    const licenses = await prisma.license.findMany({ orderBy: { createdAt: "desc" } });
    const payload = { success: true, count: licenses.length, licenses };
    return res.status ? res.status(200).json(payload) : payload;
  } catch (error) {
    const err = { success: false, error: error.message || "Failed to list licenses" };
    return res.status ? res.status(500).json(err) : err;
  }
}

module.exports = {
  generate,
  verify,
  heartbeat,
  redeemCode,
  updateStatus,
  listLicenses,
  generateUniqueLicenseKey,
  validateAppSecret,
  extractHardwareFingerprint,
};
