import { prisma } from "@/lib/prisma";

export interface RedeemRequestParams {
  code?: string;
  license_key?: string;
  licenseKey?: string;
  key?: string;
  activation_code?: string;
  activationCode?: string;
  token?: string;
  clientId?: string;
  client_app_id?: string;
  clientCode?: string;
}

export class LicenseRedemptionService {
  /**
   * Redeems a license key or voucher code and applies stacking / extensions
   */
  static async redeem(params: RedeemRequestParams, clientIp: string = "127.0.0.1") {
    const rawCode =
      params.code ||
      params.license_key ||
      params.licenseKey ||
      params.key ||
      params.activation_code ||
      params.activationCode ||
      params.token;

    const targetClientId = params.clientId || params.client_app_id || params.clientCode;

    if (!rawCode || String(rawCode).trim().length < 4) {
      return {
        statusCode: 400,
        payload: { success: false, error: "Please provide a valid code" },
      };
    }

    const cleanCode = String(rawCode).trim().toUpperCase();
    const ipStr = clientIp.split(",")[0].trim();
    const now = new Date();

    // 1. Search in LicenseCode table (pre-generated vouchers & renewal codes)
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
        return {
          statusCode: 400,
          payload: { success: false, error: "Code already used" },
        };
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
          redeemedByIp: ipStr,
        },
      });

      const durationYears = licenseCode.validityYears || 1;
      const durationMs = durationYears * 365 * 24 * 60 * 60 * 1000;
      let durationLabel = "1 Year";
      if (licenseCode.isLifetime) durationLabel = "Lifetime";
      else if (licenseCode.validityYears) durationLabel = `${licenseCode.validityYears} Year${licenseCode.validityYears > 1 ? "s" : ""}`;

      // License Stacking: add duration to future expiry if valid, else from now
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

      return {
        statusCode: 200,
        payload: {
          success: true,
          message: `Code redeemed successfully! License extended to ${stackedExpiry.toLocaleDateString("en-GB")}`,
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
        },
      };
    }

    // 2. Search in License table (Direct Commercial License Keys)
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
        return {
          statusCode: 403,
          payload: {
            success: false,
            error: `License key is ${directLicense.status.toLowerCase()} by administrator`,
          },
        };
      }

      // License Stacking: add 1 year (365 days) directly to existing expiry if in future, else from now
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
          ip_address: ipStr,
        },
      });

      return {
        statusCode: 200,
        payload: {
          success: true,
          message: `License key redeemed successfully! License extended to ${stackedExpiry.toLocaleDateString("en-GB")}`,
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
        },
      };
    }

    // 3. Not found in either table
    return {
      statusCode: 404,
      payload: {
        success: false,
        error: "Key not found in database",
        message: "Key not found in database",
      },
    };
  }
}
