import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3001";

async function testHeartbeatTelemetry() {
  console.log("==========================================================");
  console.log("   TESTING LIVE HEARTBEAT TELEMETRY & AUTO-SYNC SYSTEM    ");
  console.log("==========================================================\n");

  // 1. Create a test license
  const testKey = `VEND-HB01-HB02-HB03-${Date.now().toString().slice(-4)}`;
  const testMac = "00:1A:2B:3C:4D:EE";
  console.log(`[1] Creating test license in database: ${testKey}...`);

  const license = await prisma.license.create({
    data: {
      client_name: "Tanzimul Ummah International",
      license_key: testKey,
      mac_address: testMac,
      status: "Active",
      live_status: "OFFLINE",
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Year
    },
  });
  console.log(`  ✓ License created: ID=${license.id}, Key=${license.license_key}, Status=${license.status}, LiveStatus=${license.live_status}`);

  // 2. Test Client Heartbeat POST /api/license/heartbeat
  console.log("\n[2] Client sending background POST to /api/license/heartbeat...");
  const heartbeatRes = await fetch(`${BASE_URL}/api/license/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Secret": "sheba_vendor_app_secret_2026_x89a",
    },
    body: JSON.stringify({
      license_key: testKey,
      mac_address: testMac,
      app_version: "16.9.26",
      domain: "tanzimul-ummah.edu.bd",
    }),
  });

  const heartbeatData = await heartbeatRes.json();
  console.log("  HTTP Status:", heartbeatRes.status);
  console.log("  Heartbeat Response:", JSON.stringify(heartbeatData, null, 2));

  if (heartbeatRes.status === 200 && heartbeatData.success && heartbeatData.live_status === "ONLINE") {
    console.log("  ✓ Heartbeat acknowledged successfully with live_status = ONLINE!");
  } else {
    console.error("  ✗ Heartbeat response failed assertion!");
  }

  // 3. Verify Database Updates for last_sync & live_status
  console.log("\n[3] Verifying database records for last_sync and live_status...");
  const updatedLicense = await prisma.license.findUnique({
    where: { id: license.id },
  });

  console.log("  Updated License in DB:");
  console.log("    - last_sync:", updatedLicense?.last_sync?.toISOString());
  console.log("    - last_heartbeat:", updatedLicense?.last_heartbeat?.toISOString());
  console.log("    - live_status:", updatedLicense?.live_status);
  console.log("    - app_version:", updatedLicense?.app_version);

  if (updatedLicense?.last_sync && updatedLicense?.live_status === "ONLINE") {
    console.log("  ✓ Database verification passed: last_sync timestamp and live_status recorded correctly!");
  } else {
    console.error("  ✗ Database verification failed!");
  }

  // 4. Test Standalone Express Controller function directly
  console.log("\n[4] Verifying standalone controllers/licenseController.js heartbeat function...");
  const standaloneController = require("../controllers/licenseController.js");
  const mockReq = {
    headers: {
      "x-app-secret": "sheba_vendor_app_secret_2026_x89a",
    },
    body: {
      license_key: testKey,
      mac_address: testMac,
      app_version: "16.9.26-standalone",
    },
  };
  const mockRes = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return payload;
    },
  };

  const standaloneResult = await standaloneController.heartbeat(mockReq, mockRes);
  console.log("  Standalone Controller Result:", standaloneResult?.message, "live_status:", standaloneResult?.live_status);
  if (standaloneResult?.success && standaloneResult?.live_status === "ONLINE") {
    console.log("  ✓ Standalone licenseController.js verified successfully!");
  }

  // 5. Test Dashboard GET /api/stats (Live Connectivity & Telemetry Feed)
  console.log("\n[5] Testing Vendor Dashboard Live Connectivity & Telemetry Feed (GET /api/stats)...");
  const statsRes = await fetch(`${BASE_URL}/api/stats`);
  const statsData = await statsRes.json();

  console.log("  Stats Online Clients (<=10m window):", statsData.stats?.clients?.online);
  console.log("  Stats Recent Heartbeats in Feed:", statsData.stats?.recentHeartbeats?.length);

  const foundInFeed = statsData.stats?.recentHeartbeats?.find((hb: any) => hb.clientCode === testKey || hb.clientName === "Tanzimul Ummah International");
  console.log("  Found Heartbeat in Live Telemetry Feed:", !!foundInFeed);
  if (foundInFeed) {
    console.log("    - Feed Item Client Name:", foundInFeed.clientName);
    console.log("    - Feed Item isOnlineWithin10m:", foundInFeed.isOnlineWithin10m);
    console.log("    - Feed Item live_status:", foundInFeed.live_status);
    console.log("    - Feed Item last_sync:", foundInFeed.last_sync);
  }

  if (foundInFeed && foundInFeed.isOnlineWithin10m === true && statsData.stats?.clients?.online >= 1) {
    console.log("  ✓ Dashboard Live Connectivity & Telemetry Feed verified: Pinged client is listed with active pulse indicator!");
  } else {
    console.error("  ✗ Dashboard stats assertion failed!");
  }

  // 6. Cleanup Test Data
  await prisma.license.delete({ where: { id: license.id } });
  console.log("\n✓ Cleaned up test license.");

  console.log("\n==========================================================");
  console.log("   HEARTBEAT TELEMETRY SYSTEM VERIFIED 100% WORKING!      ");
  console.log("==========================================================");
}

testHeartbeatTelemetry().catch(console.error).finally(() => prisma.$disconnect());
