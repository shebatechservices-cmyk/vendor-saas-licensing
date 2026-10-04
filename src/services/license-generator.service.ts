import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { generateRandomCode, getCategoryPrefix, mapToValidityType } from "@/lib/code-generator";

export interface GenerateLicenseParams {
  client_name?: string;
  clientName?: string;
  mac_address?: string;
  macAddress?: string;
  validity_years?: number | string;
  validityYears?: number | string;
  expiry_date?: string | Date;
  expiryDate?: string | Date;
  status?: string;
  category?: string;
  quantity?: number;
  validityType?: string;
  validity_type?: string;
}

export class LicenseGeneratorService {
  /**
   * Generates a unique formatted cryptographic license key
   * e.g. VEND-7A9B-4C2E-8F1K-9X0Z or SHEBA-XXXX-XXXX-XXXX
   */
  static generateUniqueKey(prefix: string = "VEND"): string {
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
   * Issues a new client license key
   */
  static async issueLicense(params: GenerateLicenseParams) {
    const name = params.client_name || params.clientName;
    const mac = params.mac_address || params.macAddress;
    const years = params.validity_years !== undefined ? params.validity_years : params.validityYears;
    const explicitExpiry = params.expiry_date || params.expiryDate;
    const status = params.status || "Active";

    if (!name || !String(name).trim()) {
      throw new Error("client_name is required to generate a license.");
    }

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
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      calculatedExpiry = d;
    }

    let license_key = this.generateUniqueKey("SHEBA");
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.license.findUnique({ where: { license_key } });
      if (!existing) isUnique = true;
      else license_key = this.generateUniqueKey("SHEBA");
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

    return {
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
    };
  }

  /**
   * Issues a batch of voucher license codes
   */
  static async issueBatch(params: GenerateLicenseParams) {
    const cat = (params.category || "APP_LICENSE") as any;
    const yearsNum = params.validityYears ? Number(params.validityYears) : 1;
    const isLifetime = params.validityType === "LIFETIME" || params.validity_type === "Lifetime";
    const isQuota = cat === "STUDENT_QUOTA_UPGRADE";
    const valType = mapToValidityType(yearsNum, isLifetime, isQuota);
    const qty = Math.min(Math.max(1, parseInt(String(params.quantity || 1), 10)), 100);
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

    return {
      success: true,
      message: `Generated ${created.length} codes successfully.`,
      count: created.length,
      codes: created,
    };
  }

  /**
   * Lists all client licenses and returns aggregated stats
   */
  static async listLicenses() {
    const licenses = await prisma.license.findMany({
      orderBy: { createdAt: "desc" },
    });

    const activeCount = licenses.filter((l) => l.status === "Active").length;
    const suspendedCount = licenses.filter((l) => l.status === "Suspended" || l.status === "Blocked").length;
    const expiredCount = licenses.filter((l) => l.status === "Expired").length;

    return {
      success: true,
      count: licenses.length,
      stats: {
        total: licenses.length,
        active: activeCount,
        suspended: suspendedCount,
        expired: expiredCount,
      },
      licenses,
    };
  }

  /**
   * Updates license status and kill switch state
   */
  static async updateStatus(params: {
    id?: string;
    license_key?: string;
    licenseKey?: string;
    status?: string;
    killswitch?: boolean;
  }) {
    const targetKey = (params.license_key || params.licenseKey || "").trim();
    let targetLicense = null;

    if (params.id) {
      targetLicense = await prisma.license.findUnique({ where: { id: params.id } });
    } else if (targetKey) {
      targetLicense = await prisma.license.findUnique({ where: { license_key: targetKey } });
    }

    if (!targetLicense) {
      return {
        notFound: true,
        error: "License not found. Provide valid id or license_key.",
      };
    }

    let nextStatus = params.status;
    if (params.killswitch !== undefined) {
      nextStatus = params.killswitch ? "Suspended" : "Active";
    }

    if (!nextStatus || !["Active", "Suspended", "Expired", "Blocked"].includes(nextStatus)) {
      return {
        invalidStatus: true,
        error: `Invalid status: ${nextStatus}. Allowed: Active, Suspended, Expired, Blocked.`,
      };
    }

    const updated = await prisma.license.update({
      where: { id: targetLicense.id },
      data: { status: nextStatus },
    });

    return {
      success: true,
      message: `License status updated to [${nextStatus}] successfully.`,
      license: updated,
      killswitch: nextStatus === "Suspended" || nextStatus === "Blocked" || nextStatus === "Expired",
    };
  }

  /**
   * Deletes a license by ID
   */
  static async deleteLicense(id: string) {
    await prisma.license.delete({ where: { id } });
    return { success: true, message: "License deleted successfully" };
  }
}
