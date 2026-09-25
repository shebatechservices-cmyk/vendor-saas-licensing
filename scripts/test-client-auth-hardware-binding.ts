import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3001";
const APP_SECRET = "sheba_vendor_app_secret_2026_x89a";

async function runTestSuite() {
  console.log("=================================================================");
  console.log("   TEST SUITE: CLIENT AUTH (APP_SECRET) & HARDWARE BINDING       ");
  console.log("=================================================================\n");

  const testKey = `VEND-AUTH-HW01-${Date.now().toString().slice(-4)}`;
  const initialHwFingerprint = "HW-FP-9A8B7C6D5E4F1234-AA1122";
  const mismatchedHwFingerprint = "HW-FP-1122334455667788-BB3344";

  console.log(`[Setup] Creating unbound license key in database: ${testKey}...`);
  const createdLicense = await prisma.license.create({
    data: {
      client_name: "Tanzimul Ummah Strict Test",
      license_key: testKey,
      mac_address: null, // Initial activation: un-bound
      status: "Active",
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ Unbound license created: ID=${createdLicense.id}, MAC=${createdLicense.mac_address || "NONE (Unbound)"}`);

  // -------------------------------------------------------------
  // TEST 1: Request with Missing APP_SECRET -> Expect HTTP 401
  // -------------------------------------------------------------
  console.log("\n[Test 1] POST /api/license/verify with MISSING APP_SECRET header...");
  const noSecretRes = await fetch(`${BASE_URL}/api/license/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      license_key: testKey,
      mac_address: initialHwFingerprint,
    }),
  });
  const noSecretData = await noSecretRes.json();
  console.log("  HTTP Status:", noSecretRes.status, "(Expected: 401)");
  console.log("  Response Body:", noSecretData);

  if (noSecretRes.status === 401 && noSecretData.authorized === false) {
    console.log("  ✓ PASS: Missing APP_SECRET correctly rejected with 401 Unauthorized.");
  } else {
    throw new Error(`Test 1 Failed: Expected status 401, got ${noSecretRes.status}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Request with Invalid APP_SECRET -> Expect HTTP 401
  // -------------------------------------------------------------
  console.log("\n[Test 2] POST /api/license/heartbeat with INVALID APP_SECRET header...");
  const badSecretRes = await fetch(`${BASE_URL}/api/license/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Secret": "wrong_tampered_secret_999",
    },
    body: JSON.stringify({
      license_key: testKey,
      mac_address: initialHwFingerprint,
    }),
  });
  const badSecretData = await badSecretRes.json();
  console.log("  HTTP Status:", badSecretRes.status, "(Expected: 401)");
  console.log("  Response Body:", badSecretData);

  if (badSecretRes.status === 401 && badSecretData.authorized === false) {
    console.log("  ✓ PASS: Invalid APP_SECRET correctly rejected with 401 Unauthorized.");
  } else {
    throw new Error(`Test 2 Failed: Expected status 401, got ${badSecretRes.status}`);
  }

  // -------------------------------------------------------------
  // TEST 3: First Activation -> Valid APP_SECRET + Auto-Bind Hardware
  // -------------------------------------------------------------
  console.log("\n[Test 3] POST /api/license/verify First Activation with VALID APP_SECRET and Hardware Fingerprint...");
  const firstActivationRes = await fetch(`${BASE_URL}/api/license/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Secret": APP_SECRET,
      "X-Hardware-Fingerprint": initialHwFingerprint,
    },
    body: JSON.stringify({
      license_key: testKey,
      hardware_fingerprint: initialHwFingerprint,
    }),
  });
  const firstActivationData = await firstActivationRes.json();
  console.log("  HTTP Status:", firstActivationRes.status, "(Expected: 200)");
  console.log("  Response Body:", firstActivationData);

  const boundLicenseInDb = await prisma.license.findUnique({
    where: { id: createdLicense.id },
  });
  console.log("  Database bound mac_address:", boundLicenseInDb?.mac_address);

  if (
    firstActivationRes.status === 200 &&
    firstActivationData.authorized === true &&
    boundLicenseInDb?.mac_address === initialHwFingerprint
  ) {
    console.log("  ✓ PASS: First activation authorized and bound hardware fingerprint to DB successfully.");
  } else {
    throw new Error("Test 3 Failed: Hardware fingerprint was not bound correctly.");
  }

  // -------------------------------------------------------------
  // TEST 4: Subsequent Heartbeat with MATCHING Hardware Fingerprint -> Expect HTTP 200
  // -------------------------------------------------------------
  console.log("\n[Test 4] POST /api/license/heartbeat with MATCHING Hardware Fingerprint...");
  const matchingHeartbeatRes = await fetch(`${BASE_URL}/api/license/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Secret": APP_SECRET,
      "X-Hardware-Fingerprint": initialHwFingerprint,
    },
    body: JSON.stringify({
      license_key: testKey,
      hardware_fingerprint: initialHwFingerprint,
      app_version: "16.9.26",
    }),
  });
  const matchingHeartbeatData = await matchingHeartbeatRes.json();
  console.log("  HTTP Status:", matchingHeartbeatRes.status, "(Expected: 200)");
  console.log("  Live Status:", matchingHeartbeatData.live_status, "(Expected: ONLINE)");

  if (
    matchingHeartbeatRes.status === 200 &&
    matchingHeartbeatData.authorized === true &&
    matchingHeartbeatData.live_status === "ONLINE"
  ) {
    console.log("  ✓ PASS: Subsequent heartbeat with matching fingerprint accepted with 200 OK & ONLINE status.");
  } else {
    throw new Error(`Test 4 Failed: Expected status 200, got ${matchingHeartbeatRes.status}`);
  }

  // -------------------------------------------------------------
  // TEST 5: Subsequent Heartbeat with MISMATCHED Hardware Fingerprint -> Expect HTTP 403
  // -------------------------------------------------------------
  console.log("\n[Test 5] POST /api/license/heartbeat with MISMATCHED Hardware Fingerprint...");
  const mismatchHeartbeatRes = await fetch(`${BASE_URL}/api/license/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Secret": APP_SECRET,
      "X-Hardware-Fingerprint": mismatchedHwFingerprint,
    },
    body: JSON.stringify({
      license_key: testKey,
      hardware_fingerprint: mismatchedHwFingerprint,
    }),
  });
  const mismatchHeartbeatData = await mismatchHeartbeatRes.json();
  console.log("  HTTP Status:", mismatchHeartbeatRes.status, "(Expected: 403)");
  console.log("  Response Body:", mismatchHeartbeatData);

  if (
    mismatchHeartbeatRes.status === 403 &&
    mismatchHeartbeatData.authorized === false &&
    mismatchHeartbeatData.killswitch === true &&
    mismatchHeartbeatData.error.includes("Hardware fingerprint mismatch")
  ) {
    console.log("  ✓ PASS: Hardware mismatch correctly rejected with 403 Forbidden & Killswitch active.");
  } else {
    throw new Error(`Test 5 Failed: Expected status 403, got ${mismatchHeartbeatRes.status}`);
  }

  // -------------------------------------------------------------
  // TEST 6: Standalone Express Controller Unit Verification
  // -------------------------------------------------------------
  console.log("\n[Test 6] Standalone Express Controller (controllers/licenseController.js) Unit Verification...");
  const expressController = require("../controllers/licenseController.js");

  // A. Missing secret check
  const mockReqNoSecret = {
    headers: {},
    body: { license_key: testKey, hardware_fingerprint: initialHwFingerprint },
  };
  const mockRes1: any = {
    statusCode: 200,
    status(c: number) { this.statusCode = c; return this; },
    json(p: any) { this.data = p; return p; },
  };
  await expressController.heartbeat(mockReqNoSecret, mockRes1);
  console.log("  Express Missing Secret Status:", mockRes1.statusCode, "(Expected: 401)");
  if (mockRes1.statusCode !== 401) throw new Error("Express unit test failed for missing secret.");

  // B. Mismatch hardware check
  const mockReqMismatch = {
    headers: { "x-app-secret": APP_SECRET },
    body: { license_key: testKey, hardware_fingerprint: mismatchedHwFingerprint },
  };
  const mockRes2: any = {
    statusCode: 200,
    status(c: number) { this.statusCode = c; return this; },
    json(p: any) { this.data = p; return p; },
  };
  await expressController.heartbeat(mockReqMismatch, mockRes2);
  console.log("  Express Hardware Mismatch Status:", mockRes2.statusCode, "(Expected: 403)");
  if (mockRes2.statusCode !== 403) throw new Error("Express unit test failed for hardware mismatch.");

  // C. Matching hardware check
  const mockReqMatch = {
    headers: { "x-app-secret": APP_SECRET },
    body: { license_key: testKey, hardware_fingerprint: initialHwFingerprint },
  };
  const mockRes3: any = {
    statusCode: 200,
    status(c: number) { this.statusCode = c; return this; },
    json(p: any) { this.data = p; return p; },
  };
  await expressController.heartbeat(mockReqMatch, mockRes3);
  console.log("  Express Matching Status:", mockRes3.statusCode, "(Expected: 200)");
  if (mockRes3.statusCode !== 200) throw new Error("Express unit test failed for matching heartbeat.");

  console.log("  ✓ PASS: Standalone Express controller unit tests verified.");

  // -------------------------------------------------------------
  // Cleanup Test Data
  // -------------------------------------------------------------
  await prisma.license.delete({ where: { id: createdLicense.id } });
  await prisma.securityAlert.deleteMany({
    where: { clientCode: testKey },
  });
  console.log("\n✓ Cleaned up test data.");

  console.log("\n=================================================================");
  console.log("   ALL 6 TESTS PASSED: STRICT CLIENT AUTH & HARDWARE BINDING     ");
  console.log("=================================================================");
}

runTestSuite().catch(console.error).finally(() => prisma.$disconnect());
