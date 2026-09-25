import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

// Import CommonJS license controller
const licenseController = require("../controllers/licenseController");

async function runLicenseTests() {
  console.log("🔑 ========================================================");
  console.log("🔑 STARTING LICENSE GENERATION & MANAGEMENT ENGINE TESTS");
  console.log(`🔑 Target Base URL: ${BASE_URL}`);
  console.log("🔑 ========================================================\n");

  // TEST 1: Unit Test controllers/licenseController.js
  console.log("👉 TEST 1: Unit Test controllers/licenseController.js Key Generation");
  const uniqueKey1 = licenseController.generateUniqueLicenseKey("VEND");
  const uniqueKey2 = licenseController.generateUniqueLicenseKey("VEND");
  console.log(`   Generated Key 1: ${uniqueKey1}`);
  console.log(`   Generated Key 2: ${uniqueKey2}`);
  if (!uniqueKey1.startsWith("VEND-") || uniqueKey1 === uniqueKey2) {
    throw new Error("Test 1 Failed: License key format invalid or not unique");
  }
  console.log("   ✅ Test 1 Passed: Key Generator functioning properly.\n");

  // TEST 2: API POST /api/license/generate (Issue new License)
  console.log("👉 TEST 2: API POST /api/license/generate (Issue License for Client)");
  const clientName = "Darul Uloom Central Campus";
  const macAddress = "00:1B:44:11:3A:B7";

  const generateRes = await fetch(`${BASE_URL}/api/license/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: clientName,
      mac_address: macAddress,
      validity_years: 1,
    }),
  });

  const generateData = await generateRes.json();
  console.log("   Generate Response:", generateData);
  if (!generateData.success || !generateData.license?.license_key) {
    throw new Error("Test 2 Failed: License generation API failed");
  }
  const issuedLicense = generateData.license;
  const licenseKey = issuedLicense.license_key;
  console.log(`   Issued Key: ${licenseKey} (ID: ${issuedLicense.id})`);
  console.log("   ✅ Test 2 Passed: License Issued Successfully.\n");

  // TEST 3: API POST /api/license/verify (Valid Heartbeat & Matching MAC)
  console.log("👉 TEST 3: API POST /api/license/verify (Valid Heartbeat with Matching MAC)");
  const verifyRes1 = await fetch(`${BASE_URL}/api/license/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      license_key: licenseKey,
      mac_address: macAddress,
      app_version: "v2.5.0",
    }),
  });

  const verifyData1 = await verifyRes1.json();
  console.log("   Verify Response (Matching Hardware):", {
    status: verifyRes1.status,
    authorized: verifyData1.authorized,
    killswitch: verifyData1.killswitch,
    statusReported: verifyData1.status,
    client: verifyData1.client_name,
  });

  if (verifyRes1.status !== 200 || !verifyData1.authorized || verifyData1.killswitch) {
    throw new Error("Test 3 Failed: License verification rejected valid request");
  }
  console.log("   ✅ Test 3 Passed: Verified active license with hardware matching.\n");

  // TEST 4: API POST /api/license/verify with Hardware Mismatch
  console.log("👉 TEST 4: API POST /api/license/verify with Hardware MAC Mismatch (Tamper Check)");
  const verifyRes2 = await fetch(`${BASE_URL}/api/license/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      license_key: licenseKey,
      mac_address: "FF:FF:FF:FF:FF:FF", // Different device
      app_version: "v2.5.0",
    }),
  });

  const verifyData2 = await verifyRes2.json();
  console.log("   Verify Response (Mismatch):", {
    status: verifyRes2.status,
    authorized: verifyData2.authorized,
    killswitch: verifyData2.killswitch,
    error: verifyData2.error,
  });

  if (verifyRes2.status !== 403 || verifyData2.authorized) {
    throw new Error("Test 4 Failed: MAC Address mismatch should have been blocked");
  }
  console.log("   ✅ Test 4 Passed: Hardware tampering prevented.\n");

  // TEST 5: API POST /api/license/update-status (Flip Kill Switch ON -> Suspended)
  console.log("👉 TEST 5: API POST /api/license/update-status (Direct Kill Switch ON)");
  const killRes = await fetch(`${BASE_URL}/api/license/update-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: issuedLicense.id,
      killswitch: true, // Flip Kill Switch ON -> Suspends client
    }),
  });

  const killData = await killRes.json();
  console.log("   Killswitch Response:", {
    success: killData.success,
    status: killData.license?.status,
    killswitch: killData.killswitch,
  });

  if (!killData.success || killData.license?.status !== "Suspended") {
    throw new Error("Test 5 Failed: Kill switch did not suspend license");
  }

  // Now verify that the client app is immediately blocked on next ping
  const verifyRes3 = await fetch(`${BASE_URL}/api/license/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      license_key: licenseKey,
      mac_address: macAddress,
    }),
  });
  const verifyData3 = await verifyRes3.json();
  console.log("   Verify Response After Kill Switch:", {
    status: verifyRes3.status,
    authorized: verifyData3.authorized,
    killswitch: verifyData3.killswitch,
    statusMessage: verifyData3.message,
  });

  if (verifyRes3.status !== 403 || verifyData3.authorized || !verifyData3.killswitch) {
    throw new Error("Test 5 Failed: Suspended license was not blocked in verification");
  }
  console.log("   ✅ Test 5 Passed: Kill Switch immediately terminated client access.\n");

  // TEST 6: Restore License Access (Flip Kill Switch OFF -> Active)
  console.log("👉 TEST 6: Restore License Access (Kill Switch OFF)");
  const restoreRes = await fetch(`${BASE_URL}/api/license/update-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: issuedLicense.id,
      status: "Active",
    }),
  });
  const restoreData = await restoreRes.json();
  console.log("   Restore Result:", restoreData.message);
  if (!restoreData.success || restoreData.license?.status !== "Active") {
    throw new Error("Test 6 Failed: Could not reactivate license");
  }
  console.log("   ✅ Test 6 Passed: License successfully restored to Active.\n");

  // TEST 7: GET /api/license (List all licenses with telemetry)
  console.log("👉 TEST 7: GET /api/license (List Licenses & Aggregates)");
  const listRes = await fetch(`${BASE_URL}/api/license`);
  const listData = await listRes.json();
  console.log("   List Licenses Result:", {
    success: listData.success,
    count: listData.count,
    stats: listData.stats,
  });
  if (!listData.success || listData.count < 1) {
    throw new Error("Test 7 Failed: List licenses returned empty");
  }
  console.log("   ✅ Test 7 Passed: License List & KPI aggregates retrieved.\n");

  // Clean up test license
  await prisma.license.deleteMany({
    where: { client_name: clientName },
  });

  console.log("🔑 ========================================================");
  console.log("🎉 ALL LICENSE GENERATION & MANAGEMENT TESTS PASSED!");
  console.log("🔑 ========================================================\n");
}

runLicenseTests()
  .catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
