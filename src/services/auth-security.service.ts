import { prisma } from "@/lib/prisma";
import { generateTotpSetup, verifyTotpToken, hashPassword, comparePassword } from "@/lib/totp";
import { sendOtpSMS, generateNumericOtp, normalizePhoneNumber, maskPhoneNumber } from "@/utils/smsService";
import { isIpAuthorized, extractClientIp } from "@/middlewares/ip-whitelist.middleware";

export class AuthSecurityService {
  /**
   * Generates a set of 8 random alphanumeric backup recovery codes
   */
  static generateBackupCodes(count: number = 8): { rawCodes: string[]; hashedCodes: string[] } {
    const rawCodes: string[] = [];
    const hashedCodes: string[] = [];
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    for (let i = 0; i < count; i++) {
      let code = "";
      for (let j = 0; j < 8; j++) {
        if (j === 4) code += "-";
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      rawCodes.push(code);
      // Store a simple hash for verification
      const hash = Buffer.from(code).toString("base64");
      hashedCodes.push(hash);
    }

    return { rawCodes, hashedCodes };
  }

  /**
   * Verify backup code against user's stored backup codes
   */
  static verifyBackupCode(inputCode: string, storedHashedCodesJson: string | null): { valid: boolean; remainingHashedCodes?: string[] } {
    if (!storedHashedCodesJson) return { valid: false };
    try {
      const hashes: string[] = JSON.parse(storedHashedCodesJson);
      const inputHash = Buffer.from(inputCode.trim().toUpperCase()).toString("base64");
      const index = hashes.indexOf(inputHash);
      if (index !== -1) {
        hashes.splice(index, 1);
        return { valid: true, remainingHashedCodes: hashes };
      }
    } catch (_) {}
    return { valid: false };
  }
}
