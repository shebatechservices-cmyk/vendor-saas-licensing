import crypto from "crypto";

export type CodeCategory =
  | "APP_LICENSE"
  | "HOSTING_RENEWAL"
  | "DOMAIN_RENEWAL"
  | "STUDENT_QUOTA_UPGRADE";

export type ValidityType =
  | "YEARS_1"
  | "YEARS_2"
  | "YEARS_3"
  | "YEARS_4"
  | "YEARS_5"
  | "YEARS_6"
  | "YEARS_7"
  | "YEARS_8"
  | "YEARS_9"
  | "YEARS_10"
  | "YEARS_11"
  | "YEARS_12"
  | "LIFETIME"
  | "QUOTA_CREDITS";

// Unambiguous character set (omits 0, O, 1, I, L)
const CHAR_SET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generate a cryptographically secure random code string
 */
export function generateRandomCode(prefix: string = "SAAS", segments: number = 3, segmentLength: number = 4): string {
  const parts: string[] = [prefix];
  
  for (let i = 0; i < segments; i++) {
    let segment = "";
    const randomBytes = crypto.randomBytes(segmentLength);
    for (let j = 0; j < segmentLength; j++) {
      const index = randomBytes[j] % CHAR_SET.length;
      segment += CHAR_SET[index];
    }
    parts.push(segment);
  }
  
  return parts.join("-");
}

/**
 * Get standard prefix for code category
 */
export function getCategoryPrefix(category: CodeCategory): string {
  switch (category) {
    case "APP_LICENSE":
      return "LIC";
    case "HOSTING_RENEWAL":
      return "HOST";
    case "DOMAIN_RENEWAL":
      return "DOM";
    case "STUDENT_QUOTA_UPGRADE":
      return "QUOTA";
    default:
      return "SAAS";
  }
}

/**
 * Map years count (1 to 12) or lifetime to ValidityType enum string
 */
export function mapToValidityType(years?: number | null, isLifetime?: boolean, isQuota?: boolean): ValidityType {
  if (isQuota) return "QUOTA_CREDITS";
  if (isLifetime) return "LIFETIME";
  
  const y = Math.min(12, Math.max(1, years || 1));
  return `YEARS_${y}` as ValidityType;
}

/**
 * Extract numerical years from ValidityType
 */
export function getYearsFromValidityType(validityType: ValidityType): number | null {
  if (validityType === "LIFETIME" || validityType === "QUOTA_CREDITS") {
    return null;
  }
  const match = validityType.match(/YEARS_(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}
