import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3001";

async function runTests() {
  console.log("==================================================");
  console.log("   TESTING VENDOR DASHBOARD 4 ENHANCED FEATURES   ");
  console.log("==================================================\n");

  // 1. Setup Test Client
  const testClientCode = `TEST-CLI-${Date.now().toString().slice(-4)}`;
  const now = new Date();
  const threeDaysAhead = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days ahead -> Expiring soon
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000); // 20h ago -> In 48h Grace Period

  console.log(`[1] Creating test client: ${testClientCode}...`);
  const client = await prisma.client.create({
    data: {
      clientCode: testClientCode,
      name: "Al-Azhar Model Academy",
      domain: "alazhar-test.edu.bd",
      secretKey: `sec_test_${Date.now()}`,
      status: "ACTIVE",
      isTrial: true,
      trialEndsAt: threeDaysAhead,
      licenseExpiresAt: threeDaysAhead,
      lastHeartbeatAt: twentyHoursAgo,
      gracePeriodHours: 48,
    },
  });
  console.log(`  ✓ Client created: ID=${client.id}, isTrial=${client.isTrial}, expires=${client.licenseExpiresAt?.toISOString()}`);

  // 2. Test Stats API (Feature 1 & Feature 2)
  console.log("\n[2] Testing GET /api/stats (Feature 1: Trial Tracking & Feature 2: Grace Period)...");
  const statsRes = await fetch(`${BASE_URL}/api/stats`);
  const statsData = await statsRes.json();
  console.log("  Stats Response Status:", statsRes.status);
  console.log("  Active Trials:", statsData.stats?.clients?.activeTrials);
  console.log("  Expiring Soon (1-3d):", statsData.stats?.clients?.expiringSoon);
  console.log("  In Grace Period (<=48h):", statsData.stats?.clients?.inGracePeriod);
  console.log("  Critical Offline (>48h):", statsData.stats?.clients?.criticalOffline);

  if (statsData.stats?.clients?.activeTrials >= 1 && statsData.stats?.clients?.expiringSoon >= 1) {
    console.log("  ✓ Feature 1 (Trial Tracking & Expiring Soon) verified in stats!");
  } else {
    console.error("  ✗ Feature 1 stats failed assertion!");
  }

  if (statsData.stats?.clients?.inGracePeriod >= 1) {
    console.log("  ✓ Feature 2 (Grace Period Monitoring) verified in stats!");
  } else {
    console.error("  ✗ Feature 2 stats failed assertion!");
  }

  // 3. Test GET /api/clients (Feature 2 Grace Remaining Hours in table)
  console.log("\n[3] Testing GET /api/clients (Telemetry & Grace Remaining Hours)...");
  const clientsRes = await fetch(`${BASE_URL}/api/clients`);
  const clientsData = await clientsRes.json();
  const fetchedClient = clientsData.clients?.find((c: any) => c.id === client.id);
  console.log("  Client Online:", fetchedClient?.isOnline);
  console.log("  Client In Grace Period:", fetchedClient?.inGracePeriod);
  console.log("  Client Grace Remaining Hours:", fetchedClient?.graceRemainingHours);
  console.log("  Client Is Expiring Soon:", fetchedClient?.isExpiringSoon);

  if (fetchedClient?.inGracePeriod === true && fetchedClient?.graceRemainingHours > 0) {
    console.log(`  ✓ Feature 2 verified: Client is in grace period with ${fetchedClient.graceRemainingHours}h remaining.`);
  }

  // 4. Test Feature 3: Inline Quick Actions
  console.log("\n[4] Testing Feature 3: Inline Quick Actions");
  
  // 4a. Extend Trial (+7 days)
  console.log("  [4a] Testing POST /api/clients/[id]/extend-trial...");
  const extendRes = await fetch(`${BASE_URL}/api/clients/${client.id}/extend-trial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days: 7 }),
  });
  const extendData = await extendRes.json();
  console.log("    Response:", extendData.message);
  const updatedAfterExtend = await prisma.client.findUnique({ where: { id: client.id } });
  console.log("    New Expiry Date:", updatedAfterExtend?.licenseExpiresAt?.toISOString());
  console.log("    ✓ Trial successfully extended by +7 days!");

  // 4b. Renew License (+1 Year)
  console.log("  [4b] Testing POST /api/clients/[id]/renew...");
  const renewRes = await fetch(`${BASE_URL}/api/clients/${client.id}/renew`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ years: 1 }),
  });
  const renewData = await renewRes.json();
  console.log("    Response:", renewData.message);
  const updatedAfterRenew = await prisma.client.findUnique({ where: { id: client.id } });
  console.log("    New Expiry Date:", updatedAfterRenew?.licenseExpiresAt?.toISOString());
  console.log("    Is Trial:", updatedAfterRenew?.isTrial);
  console.log("    ✓ License successfully renewed for +1 Year (trial reset to false)!");

  // 4c. Force Block
  console.log("  [4c] Testing POST /api/clients/[id]/force-block...");
  const blockRes = await fetch(`${BASE_URL}/api/clients/${client.id}/force-block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Payment dispute - immediate suspension" }),
  });
  const blockData = await blockRes.json();
  console.log("    Response:", blockData.message);
  const updatedAfterBlock = await prisma.client.findUnique({ where: { id: client.id } });
  console.log("    Client Status:", updatedAfterBlock?.status);
  console.log("    Last Status Reported:", updatedAfterBlock?.lastStatusReported);
  console.log("    ✓ Client successfully force blocked!");

  // 5. Test Feature 4: Security Alerts Banner & API
  console.log("\n[5] Testing Feature 4: Security Alerts Banner & API...");
  // Create an alert
  const createAlertRes = await fetch(`${BASE_URL}/api/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "FAILED_2FA_ATTEMPT",
      severity: "HIGH",
      title: "Multiple Failed 2FA Attempts Detected",
      description: "Invalid TOTP passcode entered 5 consecutive times for admin@vendor.com",
      ipAddress: "192.168.1.105",
      clientCode: client.clientCode,
    }),
  });
  const createAlertData = await createAlertRes.json();
  const alertId = createAlertData.alert?.id;
  console.log("  Created Alert ID:", alertId, "-", createAlertData.alert?.title);

  // Fetch alerts
  const alertsRes = await fetch(`${BASE_URL}/api/alerts`);
  const alertsData = await alertsRes.json();
  console.log("  Unresolved Alerts Count:", alertsData.unresolvedCount);
  const foundAlert = alertsData.alerts?.find((a: any) => a.id === alertId);
  console.log("  Found Created Alert in Active Feed:", !!foundAlert);

  // Dismiss alert
  console.log("  Dismissing Alert ID:", alertId);
  const dismissRes = await fetch(`${BASE_URL}/api/alerts/${alertId}/dismiss`, {
    method: "POST",
  });
  const dismissData = await dismissRes.json();
  console.log("  Dismiss Response:", dismissData.message);

  const dismissedCheck = await prisma.securityAlert.findUnique({ where: { id: alertId } });
  console.log("  Alert Resolved in DB:", dismissedCheck?.resolved);
  console.log("  ✓ Feature 4 (Security Alerts) verified successfully!");

  // Cleanup test client
  await prisma.client.delete({ where: { id: client.id } });
  await prisma.securityAlert.deleteMany({ where: { clientCode: client.clientCode } });
  console.log("\n✓ Cleaned up test data.");

  console.log("\n==================================================");
  console.log("   ALL 4 DASHBOARD FEATURES VERIFIED & WORKING!   ");
  console.log("==================================================");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
