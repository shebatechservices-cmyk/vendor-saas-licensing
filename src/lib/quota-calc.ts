/**
 * Madrasa & School Quota & Financial Calculation Engine
 * 
 * Rules:
 * 1. 1000 Credits = 2000 BDT
 * 2. 10 Credits = 1 Student Quota
 * 3. 1000 Credits = 100 Student Quota Expansion
 * 4. Cost per credit = 2.00 BDT
 * 5. Cost per student quota = 20.00 BDT
 */

export const CREDITS_TO_BDT_RATE = 2.0; // 2 BDT per credit (1000 credits = 2000 BDT)
export const CREDITS_PER_STUDENT = 10;   // 10 credits = 1 student quota

export interface QuotaCalculation {
  credits: number;
  students: number;
  priceBdt: number;
  priceFormatted: string;
}

/**
 * Calculate pricing and students from credits
 */
export function calculateFromCredits(credits: number): QuotaCalculation {
  const normalizedCredits = Math.max(0, Math.floor(credits));
  const students = Math.floor(normalizedCredits / CREDITS_PER_STUDENT);
  const priceBdt = normalizedCredits * CREDITS_TO_BDT_RATE;
  
  return {
    credits: normalizedCredits,
    students,
    priceBdt,
    priceFormatted: `${priceBdt.toLocaleString()} BDT`,
  };
}

/**
 * Calculate pricing and credits from student quota count
 */
export function calculateFromStudents(students: number): QuotaCalculation {
  const normalizedStudents = Math.max(0, Math.floor(students));
  const credits = normalizedStudents * CREDITS_PER_STUDENT;
  const priceBdt = credits * CREDITS_TO_BDT_RATE;

  return {
    credits,
    students: normalizedStudents,
    priceBdt,
    priceFormatted: `${priceBdt.toLocaleString()} BDT`,
  };
}

/**
 * Calculate default price for license categories and validity
 */
export function calculateLicensePrice(
  category: "APP_LICENSE" | "HOSTING_RENEWAL" | "DOMAIN_RENEWAL" | "STUDENT_QUOTA_UPGRADE",
  validityYears?: number | null,
  isLifetime?: boolean,
  quotaCredits?: number | null
): { priceBdt: number; description: string } {
  if (category === "STUDENT_QUOTA_UPGRADE") {
    const credits = quotaCredits || 1000;
    const calc = calculateFromCredits(credits);
    return {
      priceBdt: calc.priceBdt,
      description: `${calc.students} Students Quota (${calc.credits} Credits)`,
    };
  }

  if (isLifetime) {
    switch (category) {
      case "APP_LICENSE":
        return { priceBdt: 75000, description: "Lifetime App License" };
      case "HOSTING_RENEWAL":
        return { priceBdt: 45000, description: "Lifetime High-Speed Cloud Hosting" };
      case "DOMAIN_RENEWAL":
        return { priceBdt: 20000, description: "Lifetime Domain Registry (.edu.bd/.com)" };
      default:
        return { priceBdt: 50000, description: "Lifetime License" };
    }
  }

  const years = validityYears || 1;
  switch (category) {
    case "APP_LICENSE":
      return { priceBdt: years * 10000, description: `${years} Year(s) App License` };
    case "HOSTING_RENEWAL":
      return { priceBdt: years * 5000, description: `${years} Year(s) Cloud Hosting` };
    case "DOMAIN_RENEWAL":
      return { priceBdt: years * 1500, description: `${years} Year(s) Domain (.edu.bd/.com)` };
    default:
      return { priceBdt: years * 5000, description: `${years} Year(s) Validity` };
  }
}
