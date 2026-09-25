import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

/**
 * Generate a new TOTP secret, QR code data URL, and backup codes for Google Authenticator / Authy
 */
export async function generateTotpSetup(
  accountName: string,
  issuer: string = "Vendor SaaS Licensing"
): Promise<TotpSetupResult> {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer,
    label: accountName,
    secret,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  // Generate 8 secure alphanumeric backup recovery codes
  const backupCodes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
    backupCodes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes,
  };
}

/**
 * Verify a 6-digit TOTP code against a secret
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    const cleanToken = token.replace(/\s+/g, "").trim();
    const result = verifySync({
      token: cleanToken,
      secret,
      epochTolerance: 30, // 30s clock drift tolerance
    });
    return !!(result && result.valid);
  } catch (error) {
    return false;
  }
}

/**
 * Hash password securely using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
