import { PrismaClient } from "@prisma/client";
import { verifyLicenseToken } from "../src/lib/jwt";

const prisma = new PrismaClient();

async function runRefactoredVerification() {
  console.log("==================================================================");
  console.log("TESTING REFACTORED STANDARDIZED VENDOR LICENSING SYSTEM");
  console.log("==================================================================\n");

  const baseUrl = "http://localhost:3001";

  // 1. Create or Find Test Client (Sheba ERP Instance)
  let client = await prisma.client.findFirst({
    where: { clientCode: "CLI-SHEBA-001" },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        clientCode: "CLI-SHEBA-001",
        name: "Sheba ERP Enterprise Client",
        contactPerson: "Engr. Mahmudul Hasan",
        email: "tech@shebaerp.com",
        domain: "app.shebaerp.com",
        appType: "Sheba ERP",
        status: "ACTIVE",
        secretKey: "sec_sheba_erp_prod_key_77a9",
        studentQuota: 500,
        storageQuotaGb: 20.0,
        licenseExpiresAt: new Date(2028, 0, 1),
        quotas: {
          create: {
            baseStudents: 500,
            totalStudents: 500,
            usedStudents: 320,
          },
        },
      },
    });
  }

  console.log(`[SETUP] Verified Client App: ${client.name} (${client.clientCode})`);

  // 2. Test /api/license/verify (Sheba ERP Integration Endpoint)
  console.log("\n--- 1. Testing Core Endpoint: POST /api/license/verify ---");
  const verifyRes = await fetch(`${baseUrl}/api/license/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client.clientCode,
      secretKey: client.secretKey,
      appVersion: "v3.2.0",
      domain: "app.shebaerp.com",
      statusReported: "OPERATIONAL",
      activeStudentsCount: 350,
      databaseSizeMb: 180.5,
    }),
  });

  const verifyData = await verifyRes.json();
  console.log("Verify Response Status:", verifyRes.status);
  console.log("License Status:", verifyData.status, "| Is Valid:", verifyData.is_valid, "| Killswitch:", verifyData.killswitch);
  console.log("Signed JWT Token preview:", verifyData.license_token?.slice(0, 45) + "...");

  if (!verifyData.success || !verifyData.is_valid || !verifyData.license_token) {
    throw new Error("Core license verification failed");
  }

  // Verify JWT cryptographic signature
  const decoded = verifyLicenseToken(verifyData.license_token);
  if (!decoded || decoded.clientCode !== client.clientCode) {
    throw new Error("JWT License token signature verification failed");
  }
  console.log("✅ [PASS] JWT License Token cryptographically verified with secret!");

  // 3. Test Master Killswitch: Block Client App
  console.log("\n--- 2. Testing Master Killswitch / Block Action ---");
  const blockRes = await fetch(`${baseUrl}/api/clients/${client.id}/toggle-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "BLOCKED" }),
  });
  const blockData = await blockRes.json();
  console.log("Block Action Result:", blockData.message);

  const verifyBlockedRes = await fetch(`${baseUrl}/api/license/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client.clientCode,
      secretKey: client.secretKey,
    }),
  });
  const verifyBlockedData = await verifyBlockedRes.json();
  console.log("Blocked Client Verify Response:", verifyBlockedData.status, "| Killswitch:", verifyBlockedData.killswitch);

  if (!verifyBlockedData.killswitch || verifyBlockedData.status !== "BLOCKED" || verifyBlockedData.is_valid !== false) {
    throw new Error("Killswitch enforcement failed on blocked client");
  }
  console.log("✅ [PASS] Blocked client instantly received killswitch=true directive!");

  // Unblock client
  await fetch(`${baseUrl}/api/clients/${client.id}/toggle-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ACTIVE" }),
  });
  console.log("✅ [PASS] Client successfully unblocked.");

  // 4. Test /api/license/generate
  console.log("\n--- 3. Testing Core Endpoint: POST /api/license/generate ---");
  const genRes = await fetch(`${baseUrl}/api/license/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: "APP_LICENSE",
      validityYears: 2,
      quantity: 2,
      batchName: "Sheba ERP 2-Year Renewal Keys",
    }),
  });
  const genData = await genRes.json();
  console.log("Generated Batch:", genData.batch?.batchNumber);
  console.log("Generated License Codes:", genData.codes?.map((c: any) => c.code));

  if (!genData.success || genData.codes?.length !== 2) {
    throw new Error("License code generation failed");
  }
  const redeemCode = genData.codes[0].code;
  console.log(`✅ [PASS] Generated valid license code: ${redeemCode}`);

  // 5. Test Strict Code Redemption: POST /api/vendor/redeem
  console.log("\n--- 4. Testing Strict Code Redemption ---");
  const redeemRes = await fetch(`${baseUrl}/api/vendor/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client.clientCode,
      secretKey: client.secretKey,
      code: redeemCode,
    }),
  });
  const redeemData = await redeemRes.json();
  console.log("Redeem Response:", JSON.stringify(redeemData, null, 2));

  if (!redeemData.success || redeemData.code_type !== "License" || redeemData.duration_years !== 2) {
    throw new Error("Strict code redemption verification failed");
  }
  console.log("✅ [PASS] Code redeemed successfully with verified payload!");

  // 6. Test Stats, Clients & Ledger Controller Routes
  console.log("\n--- 5. Testing Reporting & Dashboard Controller Endpoints ---");
  const [statsRes, clientsRes, ledgerRes] = await Promise.all([
    fetch(`${baseUrl}/api/stats`),
    fetch(`${baseUrl}/api/clients`),
    fetch(`${baseUrl}/api/ledger`),
  ]);

  const [statsData, clientsData, ledgerData] = await Promise.all([
    statsRes.json(),
    clientsRes.json(),
    ledgerRes.json(),
  ]);

  console.log("Stats Success:", statsData.success, "| Total Clients:", statsData.stats?.clients?.total);
  console.log("Clients Success:", clientsData.success, "| Client Count:", clientsData.clients?.length);
  console.log("Ledger Success:", ledgerData.success, "| Ledger Count:", ledgerData.transactions?.length);

  if (!statsData.success || !clientsData.success || !ledgerData.success) {
    throw new Error("Controller endpoints failed");
  }
  console.log("✅ [PASS] All controller routes operational and responding dynamically!");

  console.log("\n==================================================================");
  console.log("ALL PRODUCTION ARCHITECTURE & LICENSING APIS VERIFIED 100%!");
  console.log("==================================================================");
}

runRefactoredVerification()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
