/**
 * License Controller for Vendor SaaS Central Management Engine
 * Provides: /generate (issue keys), /verify (heartbeat check), /update-status (Kill Switch & status management)
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

/**
 * Helper: Generate a unique formatted cryptographic license key
 * e.g. VEND-7A9B-4C2E-8F1K-9X0Z
 */
function generateUniqueLicenseKey(prefix = "VEND") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Base32 unambiguous set
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
 * Helper: Validate incoming APP_SECRET from request headers / body
 */
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

  // Also verify against database client secret keys if client-specific
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
 * Helper: Extract Hardware Fingerprint from headers or body
 */
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

/**
 * 1. Generate new unique License Key
 * POST /generate or POST /api/license/generate
 */
async function generate(req, res) {
  try {
    const body = req.body || {};
    const { client_name, mac_address, validity_years, expiry_date, status = "Active" } = body;

    if (!client_name || !client_name.trim()) {
      const errorPayload = { success: false, error: "client_name is required" };
      return res.status ? res.status(400).json(errorPayload) : errorPayload;
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
      license: {
        id: license.id,
        client_name: license.client_name,
        license_key: license.license_key,
        mac_address: license.mac_address,
        expiry_date: license.expiry_date,
        status: license.status,
        createdAt: license.createdAt,
      },
    };

    if (res.status) return res.status(201).json(responseData);
    return responseData;
  } catch (error) {
    console.error("❌ Generate License Error:", error);
    const errPayload = { success: false, error: error.message || "Failed to generate license" };
    if (res.status) return res.status(500).json(errPayload);
    return errPayload;
  }
}

/**
 * 2. Verify License & Client Heartbeat
 * POST /verify or POST /api/license/verify
 */
async function verify(req, res) {
  try {
    const clientIp = (req.body && req.body.ip_address) || (req.headers && req.headers["x-forwarded-for"]) || "127.0.0.1";
    const ipStr = typeof clientIp === "string" ? clientIp.split(",")[0].trim() : "127.0.0.1";

    // 1. Verify APP_SECRET from request headers
    const authCheck = await validateAppSecret(req);
    if (!authCheck.valid) {
      // Log security alert for unauthorized client call
      await prisma.securityAlert.create({
        data: {
          type: "UNAUTHORIZED_REQUEST",
          severity: "HIGH",
          title: "Unauthorized Client Request",
          description: `License verify rejected: ${authCheck.error}`,
          ipAddress: ipStr,
        },
      }).catch(() => null);

      const unauthPayload = {
        success: false,
        authorized: false,
        error: authCheck.error || "Unauthorized: Missing or invalid APP_SECRET header.",
      };
      if (res.status) return res.status(401).json(unauthPayload);
      return unauthPayload;
    }

    const body = req.body || {};
    const { license_key, app_version } = body;

    if (!license_key) {
      const errPayload = { success: false, authorized: false, error: "license_key is required" };
      return res.status ? res.status(400).json(errPayload) : errPayload;
    }

    const cleanKey = license_key.trim();
    const license = await prisma.license.findUnique({
      where: { license_key: cleanKey },
    });

    if (!license) {
      const notFoundPayload = {
        success: false,
        authorized: false,
        killswitch: true,
        status: "Invalid",
        error: "License Key not found or invalid",
      };
      return res.status ? res.status(404).json(notFoundPayload) : notFoundPayload;
    }

    const now = new Date();
    let currentStatus = license.status;

    // Check if expired
    if (license.expiry_date && new Date(license.expiry_date) < now) {
      currentStatus = "Expired";
      if (license.status !== "Expired") {
        await prisma.license.update({
          where: { id: license.id },
          data: { status: "Expired" },
        });
      }
    }

    // 2. Hardware Fingerprint Binding & Enforcement
    const incomingFingerprint = extractHardwareFingerprint(req);

    if (license.mac_address) {
      const registeredFp = license.mac_address.trim().toUpperCase();
      if (!incomingFingerprint || registeredFp !== incomingFingerprint) {
        // Log security alert
        await prisma.securityAlert.create({
          data: {
            type: "HARDWARE_MISMATCH",
            severity: "HIGH",
            title: "Hardware Fingerprint Mismatch",
            description: `Verification blocked for key ${cleanKey}. Bound device: ${registeredFp}, Incoming: ${incomingFingerprint || "NONE"}.`,
            clientCode: cleanKey,
            ipAddress: ipStr,
          },
        }).catch(() => null);

        const macMismatchPayload = {
          success: false,
          authorized: false,
          killswitch: true,
          status: "Blocked",
          error: "Hardware fingerprint mismatch. License is bound to another machine.",
          registered_hardware: registeredFp,
          provided_hardware: incomingFingerprint || null,
        };
        return res.status ? res.status(403).json(macMismatchPayload) : macMismatchPayload;
      }
    } else if (!license.mac_address && incomingFingerprint) {
      // Auto-bind hardware fingerprint on first activation/verification
      await prisma.license.update({
        where: { id: license.id },
        data: { mac_address: incomingFingerprint },
      });
      console.log(`🔒 [License Engine] Bound license ${cleanKey} to hardware fingerprint: ${incomingFingerprint}`);
    }

    // Update Heartbeat & Telemetry
    await prisma.license.update({
      where: { id: license.id },
      data: {
        last_heartbeat: now,
        ip_address: ipStr,
        app_version: app_version || license.app_version,
      },
    });

    // Check Kill Switch / Block Directive
    const isKillswitchActive = currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
    const isAuthorized = currentStatus === "Active" && !isKillswitchActive;

    const resultPayload = {
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
        : `License is ${currentStatus}. Application access restricted.`,
    };

    if (res.status) {
      const statusCode = isAuthorized ? 200 : (currentStatus === "Expired" ? 402 : 403);
      return res.status(statusCode).json(resultPayload);
    }
    return resultPayload;
  } catch (error) {
    console.error("❌ Verify License Error:", error);
    const errPayload = { success: false, authorized: false, error: error.message || "License verification failed" };
    if (res.status) return res.status(500).json(errPayload);
    return errPayload;
  }
}

/**
 * 3. Update License Status (Active, Suspended, Expired, Blocked) & Direct Kill Switch
 * POST /update-status or POST /api/license/update-status
 */
async function updateStatus(req, res) {
  try {
    const body = req.body || {};
    const { id, license_key, status, killswitch } = body;

    let targetLicense = null;
    if (id) {
      targetLicense = await prisma.license.findUnique({ where: { id } });
    } else if (license_key) {
      targetLicense = await prisma.license.findUnique({ where: { license_key: license_key.trim() } });
    }

    if (!targetLicense) {
      const errPayload = { success: false, error: "License not found. Provide valid id or license_key." };
      return res.status ? res.status(404).json(errPayload) : errPayload;
    }

    let nextStatus = status;
    if (killswitch !== undefined) {
      nextStatus = killswitch ? "Suspended" : "Active";
    }

    if (!nextStatus || !["Active", "Suspended", "Expired", "Blocked"].includes(nextStatus)) {
      const errPayload = {
        success: false,
        error: `Invalid status: ${nextStatus}. Allowed: Active, Suspended, Expired, Blocked.`,
      };
      return res.status ? res.status(400).json(errPayload) : errPayload;
    }

    const updated = await prisma.license.update({
      where: { id: targetLicense.id },
      data: { status: nextStatus },
    });

    const responsePayload = {
      success: true,
      message: `License status updated to [${nextStatus}] successfully.`,
      license: updated,
      killswitch: nextStatus === "Suspended" || nextStatus === "Blocked" || nextStatus === "Expired",
    };

    if (res.status) return res.status(200).json(responsePayload);
    return responsePayload;
  } catch (error) {
    console.error("❌ Update Status Error:", error);
    const errPayload = { success: false, error: error.message || "Failed to update license status" };
    if (res.status) return res.status(500).json(errPayload);
    return errPayload;
  }
}

/**
 * 4. List all licenses
 * GET /api/license
 */
async function listLicenses(req, res) {
  try {
    const licenses = await prisma.license.findMany({
      orderBy: { createdAt: "desc" },
    });

    const responsePayload = {
      success: true,
      count: licenses.length,
      licenses,
    };

    if (res.status) return res.status(200).json(responsePayload);
    return responsePayload;
  } catch (error) {
    const errPayload = { success: false, error: error.message || "Failed to list licenses" };
    if (res.status) return res.status(500).json(errPayload);
    return errPayload;
  }
}

/**
 * 5. Client Heartbeat Telemetry
 * POST /heartbeat or POST /api/license/heartbeat
 */
async function heartbeat(req, res) {
  try {
    const clientIp = (req.body && req.body.ip_address) || (req.headers && req.headers["x-forwarded-for"]) || "127.0.0.1";
    const ipStr = typeof clientIp === "string" ? clientIp.split(",")[0].trim() : "127.0.0.1";

    // 1. Verify APP_SECRET from request headers
    const authCheck = await validateAppSecret(req);
    if (!authCheck.valid) {
      await prisma.securityAlert.create({
        data: {
          type: "UNAUTHORIZED_REQUEST",
          severity: "HIGH",
          title: "Unauthorized Heartbeat Request",
          description: `Heartbeat ping rejected: ${authCheck.error}`,
          ipAddress: ipStr,
        },
      }).catch(() => null);

      const unauthPayload = {
        success: false,
        authorized: false,
        error: authCheck.error || "Unauthorized: Missing or invalid APP_SECRET header.",
      };
      if (res.status) return res.status(401).json(unauthPayload);
      return unauthPayload;
    }

    const body = req.body || {};
    const {
      license_key,
      licenseKey,
      app_version,
      statusReported,
      activeStudentsCount,
    } = body;

    const key = (license_key || licenseKey || "").trim();

    if (!key) {
      const errPayload = { success: false, error: "license_key is required for heartbeat" };
      if (res.status) return res.status(400).json(errPayload);
      return errPayload;
    }

    const license = await prisma.license.findUnique({
      where: { license_key: key },
    });

    if (!license) {
      const notFoundPayload = {
        success: false,
        authorized: false,
        killswitch: true,
        live_status: "INVALID",
        error: "License Key not found",
      };
      if (res.status) return res.status(404).json(notFoundPayload);
      return notFoundPayload;
    }

    const now = new Date();
    let currentStatus = license.status;

    // Check expiry
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
    const incomingFingerprint = extractHardwareFingerprint(req);

    if (license.mac_address) {
      const registeredFp = license.mac_address.trim().toUpperCase();
      if (!incomingFingerprint || registeredFp !== incomingFingerprint) {
        // Log security alert
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

        const macMismatchPayload = {
          success: false,
          authorized: false,
          killswitch: true,
          live_status: "BLOCKED",
          status: "Blocked",
          error: "Hardware fingerprint mismatch. License is bound to another machine.",
          registered_hardware: registeredFp,
          provided_hardware: incomingFingerprint || null,
        };
        if (res.status) return res.status(403).json(macMismatchPayload);
        return macMismatchPayload;
      }
    } else if (!license.mac_address && incomingFingerprint) {
      // Auto-bind hardware fingerprint on first heartbeat
      await prisma.license.update({
        where: { id: license.id },
        data: { mac_address: incomingFingerprint },
      });
      console.log(`🔒 [License Engine] Bound license ${key} to hardware fingerprint: ${incomingFingerprint}`);
    }

    const isKillswitchActive = currentStatus === "Suspended" || currentStatus === "Blocked" || currentStatus === "Expired";
    const isAuthorized = currentStatus === "Active" && !isKillswitchActive;
    const calculatedLiveStatus = isKillswitchActive ? (currentStatus === "Expired" ? "WARNING" : "BLOCKED") : "ONLINE";

    // Update last_sync and live_status in database
    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        last_sync: now,
        last_heartbeat: now,
        live_status: calculatedLiveStatus,
        ip_address: ipStr,
        app_version: app_version || license.app_version,
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
      const statusCode = isAuthorized ? 200 : (currentStatus === "Expired" ? 402 : 403);
      return res.status(statusCode).json(responsePayload);
    }
    return responsePayload;
  } catch (error) {
    console.error("❌ License Heartbeat Error:", error);
    const errPayload = { success: false, error: error.message || "Failed to process heartbeat" };
    if (res.status) return res.status(500).json(errPayload);
    return errPayload;
  }
}

module.exports = {
  generate,
  verify,
  heartbeat,
  updateStatus,
  listLicenses,
  generateUniqueLicenseKey,
  validateAppSecret,
  extractHardwareFingerprint,
};


