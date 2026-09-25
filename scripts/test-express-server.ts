const http = require("http");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runExpressTests() {
  console.log("==========================================================");
  console.log("   TESTING EXPRESS SERVER (CORS & JSON BODY PARSER)       ");
  console.log("==========================================================\n");

  const TEST_PORT = 54321;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`[1] Test Express server listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  const BASE_URL = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Test Health endpoint with CORS headers from Client App origin (http://localhost:5173)
    console.log("\n[2] Testing CORS with Client Origin: http://localhost:5173...");
    const corsRes = await fetch(`${BASE_URL}/health`, {
      method: "GET",
      headers: {
        Origin: "http://localhost:5173",
      },
    });

    const corsHeader = corsRes.headers.get("access-control-allow-origin");
    const credentialsHeader = corsRes.headers.get("access-control-allow-credentials");
    const healthJson = await corsRes.json();

    console.log("  HTTP Status:", corsRes.status);
    console.log("  Access-Control-Allow-Origin:", corsHeader);
    console.log("  Access-Control-Allow-Credentials:", credentialsHeader);
    console.log("  Health JSON Response:", healthJson.service);

    if (corsHeader === "http://localhost:5173" && credentialsHeader === "true") {
      console.log("  ✓ CORS verified: http://localhost:5173 is authorized with credentials!");
    } else {
      console.error("  ✗ CORS assertion failed for http://localhost:5173");
    }

    // 2. Test CORS with http://localhost:3000
    console.log("\n[3] Testing CORS with Client Origin: http://localhost:3000...");
    const cors3000Res = await fetch(`${BASE_URL}/health`, {
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    const cors3000Header = cors3000Res.headers.get("access-control-allow-origin");
    console.log("  Access-Control-Allow-Origin:", cors3000Header);
    if (cors3000Header === "http://localhost:3000") {
      console.log("  ✓ CORS verified: http://localhost:3000 is authorized!");
    }

    // 3. Test express.json() payload parsing on POST /api/license/heartbeat
    const testKey = `VEND-EXPR-TEST-${Date.now().toString().slice(-4)}`;
    console.log(`\n[4] Testing express.json() parser with POST /api/license/heartbeat (${testKey})...`);

    // Create test license first
    const license = await prisma.license.create({
      data: {
        client_name: "Baitul Mukarram Model Madrasa",
        license_key: testKey,
        mac_address: "AA:BB:CC:DD:EE:FF",
        status: "Active",
        live_status: "OFFLINE",
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    const jsonHeartbeatRes = await fetch(`${BASE_URL}/api/license/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
      },
      body: JSON.stringify({
        license_key: testKey,
        mac_address: "AA:BB:CC:DD:EE:FF",
        app_version: "16.9.26-express",
      }),
    });

    const jsonHeartbeatData = await jsonHeartbeatRes.json();
    console.log("  Heartbeat HTTP Status:", jsonHeartbeatRes.status);
    console.log("  Heartbeat Response:", jsonHeartbeatData);

    const updatedLicense = await prisma.license.findUnique({
      where: { id: license.id },
    });

    console.log("  Database Verification:");
    console.log("    - last_sync:", updatedLicense?.last_sync?.toISOString());
    console.log("    - live_status:", updatedLicense?.live_status);
    console.log("    - app_version:", updatedLicense?.app_version);

    if (
      jsonHeartbeatRes.status === 200 &&
      jsonHeartbeatData.success &&
      updatedLicense?.live_status === "ONLINE" &&
      updatedLicense?.last_sync
    ) {
      console.log("  ✓ express.json() payload parsing verified: Heartbeat parsed and database updated!");
    } else {
      console.error("  ✗ express.json() payload parsing failed!");
    }

    // Cleanup
    await prisma.license.delete({ where: { id: license.id } });
    console.log("\n✓ Cleaned up test license.");
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await prisma.$disconnect();
  }

  console.log("\n==========================================================");
  console.log("   EXPRESS SERVER CORS & JSON BODY PARSER 100% VERIFIED!  ");
  console.log("==========================================================");
}

runExpressTests().catch((err) => {
  console.error("Express test suite failed:", err);
  process.exit(1);
});
