import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "vendor_default_jwt_secret_key_2026_fallback";

export interface LicenseTokenPayload {
  clientId: string;
  clientCode: string;
  name: string;
  domain?: string | null;
  status: "ACTIVE" | "BLOCKED" | "SUSPENDED" | "EXPIRED";
  isLifetime: boolean;
  licenseExpiresAt: string | null;
  hostingExpiresAt: string | null;
  domainExpiresAt: string | null;
  studentQuota: number;
  storageQuotaGb: number;
  issuedAt: string;
}

/**
 * Sign a cryptographic License Token for client apps (e.g. Sheba ERP)
 */
export function signLicenseToken(payload: LicenseTokenPayload, expiresIn: string = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as any,
    issuer: "Vendor-License-Controller",
    subject: payload.clientCode,
  });
}

/**
 * Verify a cryptographic License Token
 */
export function verifyLicenseToken(token: string): LicenseTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "Vendor-License-Controller",
    });
    return decoded as LicenseTokenPayload;
  } catch (error) {
    return null;
  }
}
