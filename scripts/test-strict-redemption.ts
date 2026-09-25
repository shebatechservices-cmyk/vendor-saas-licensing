import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testStrictRedemption() {
  console.log("=================================================");
  console.log("TESTING STRICT VENDOR CODE VERIFICATION RULES");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3001";

  // Ensure a test client exists
  let client = await prisma.client.findFirst({
    where: { clientCode: "CLI-MADRASA-TEST" },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        clientCode: "CLI-MADRASA-TEST",
        name: "Test Madrasa Institution",
        secretKey: "sec_test_secret_key_123",
        status: "ACTIVE",
        studentQuota: 200,
        licenseExpiresAt: new Date(2026, 8, 17),
      },
    });
  }

  // Create 1 fresh test code
  const testCodeStr = "TEST-STRICT-LIC-01";
  await prisma.licenseCode.deleteMany({ where: { code: testCodeStr } });
  const newCode = await prisma.licenseCode.create({
    data: {
      code: testCodeStr,
      category: "APP_LICENSE",
      validityType: "YEARS_1",
      validityYears: 1,
      priceBdt: 10000,
      status: "AVAILABLE",
    },
  });

  console.log(`[SETUP] Created test code: ${newCode.code} (Status: AVAILABLE)`);

  // 1. Test Database Validation (Fake code)
  console.log("\n--- 1. Testing Fake / Tampered Code Rejection ---");
  const fakeRes = await fetch(`${baseUrl}/api/vendor/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client.clientCode,
      secretKey: client.secretKey,
      code: "FAKE-CODE-9999-TAMPER",
    }),
  });
  const fakeData = await fakeRes.json();
  console.log(`Status: ${fakeRes.status}, Response:`, fakeData);
  if (fakeRes.status !== 400 || fakeData.error !== "Invalid Code") {
    throw new Error("Fake code validation check failed");
  }
  console.log("✅ [PASS] Fake code correctly rejected with 400 'Invalid Code'.");

  // 2. Test Valid Code Redemption and Secure Payload
  console.log("\n--- 2. Testing Valid Redemption & Secure Payload Return ---");
  const validRes = await fetch(`${baseUrl}/api/vendor/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client.clientCode,
      secretKey: client.secretKey,
      code: testCodeStr,
    }),
  });
  const validData = await validRes.json();
  console.log(`Status: ${validRes.status}, Response:`, JSON.stringify(validData, null, 2));

  if (
    validRes.status !== 200 ||
    !validData.success ||
    validData.code_type !== "License" ||
    validData.duration !== "1 Year" ||
    validData.duration_years !== 1
  ) {
    throw new Error("Valid redemption payload verification failed");
  }
  console.log("✅ [PASS] Valid code redeemed and returned strict DB verified payload.");

  // 3. Test Status Check (Attempting to re-use already used code)
  console.log("\n--- 3. Testing Already Used Code Rejection ---");
  const reusedRes = await fetch(`${baseUrl}/api/vendor/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client.clientCode,
      secretKey: client.secretKey,
      code: testCodeStr,
    }),
  });
  const reusedData = await reusedRes.json();
  console.log(`Status: ${reusedRes.status}, Response:`, reusedData);

  if (reusedRes.status !== 400 || reusedData.error !== "Code already used") {
    throw new Error("Already used code check failed");
  }
  console.log("✅ [PASS] Re-used code correctly rejected with 400 'Code already used'.");

  console.log("\n=================================================");
  console.log("STRICT VENDOR CODE VERIFICATION FULLY TESTED & VERIFIED!");
  console.log("=================================================");
}

testStrictRedemption()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
