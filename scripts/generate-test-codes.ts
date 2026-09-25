import { PrismaClient } from "@prisma/client";
import { generateRandomCode } from "../src/lib/code-generator";

const prisma = new PrismaClient();

async function generateTestCodes() {
  console.log("\n=================================================");
  console.log("GENERATING 3 ACTIVE TEST CODES FOR CLIENT APP");
  console.log("=================================================\n");

  // 1. App License Code (1 Year)
  const appLicenseCodeStr = generateRandomCode("LIC", 3, 4);
  const appLicense = await prisma.licenseCode.create({
    data: {
      code: appLicenseCodeStr,
      category: "APP_LICENSE",
      validityType: "YEARS_1",
      validityYears: 1,
      isLifetime: false,
      priceBdt: 10000,
      status: "AVAILABLE",
      note: "1-Year App License Test Code",
    },
  });

  // 2. Domain Renewal Code (1 Year)
  const domainCodeStr = generateRandomCode("DOM", 3, 4);
  const domainRenewal = await prisma.licenseCode.create({
    data: {
      code: domainCodeStr,
      category: "DOMAIN_RENEWAL",
      validityType: "YEARS_1",
      validityYears: 1,
      isLifetime: false,
      priceBdt: 1500,
      status: "AVAILABLE",
      note: "1-Year Domain Renewal Test Code",
    },
  });

  // 3. Hosting Renewal Code (1 Year)
  const hostingCodeStr = generateRandomCode("HOST", 3, 4);
  const hostingRenewal = await prisma.licenseCode.create({
    data: {
      code: hostingCodeStr,
      category: "HOSTING_RENEWAL",
      validityType: "YEARS_1",
      validityYears: 1,
      isLifetime: false,
      priceBdt: 5000,
      status: "AVAILABLE",
      note: "1-Year Hosting Renewal Test Code",
    },
  });

  console.log("✅ 3 Test Codes successfully generated and saved with status 'AVAILABLE':\n");
  console.log("----------------------------------------------------------------------");
  console.log(`1. [APP LICENSE - 1 YEAR]:       ${appLicense.code}`);
  console.log(`   - Category:  ${appLicense.category}`);
  console.log(`   - Validity:  1 Year`);
  console.log(`   - Status:    ${appLicense.status}`);
  console.log(`   - Price:     ${appLicense.priceBdt} BDT`);
  console.log("----------------------------------------------------------------------");
  console.log(`2. [DOMAIN RENEWAL - 1 YEAR]:    ${domainRenewal.code}`);
  console.log(`   - Category:  ${domainRenewal.category}`);
  console.log(`   - Validity:  1 Year`);
  console.log(`   - Status:    ${domainRenewal.status}`);
  console.log(`   - Price:     ${domainRenewal.priceBdt} BDT`);
  console.log("----------------------------------------------------------------------");
  console.log(`3. [HOSTING RENEWAL - 1 YEAR]:   ${hostingRenewal.code}`);
  console.log(`   - Category:  ${hostingRenewal.category}`);
  console.log(`   - Validity:  1 Year`);
  console.log(`   - Status:    ${hostingRenewal.status}`);
  console.log(`   - Price:     ${hostingRenewal.priceBdt} BDT`);
  console.log("----------------------------------------------------------------------\n");
}

generateTestCodes()
  .catch((e) => {
    console.error("Error generating codes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
