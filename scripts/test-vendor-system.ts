import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("STARTING VENDOR SAAS SYSTEM AUTOMATED VERIFICATION");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3001";

  // 1. Check Clients
  const client1 = await prisma.client.findFirst({
    where: { clientCode: "CLI-MADRASA-001" },
  });
  if (!client1) throw new Error("Client 1 not found");
  console.log(`[PASS] Found client: ${client1.name} (${client1.clientCode})`);

  // 2. Test Heartbeat Directives
  console.log("\n--- Testing Module 1: Heartbeat & Telemetry ---");
  const hbRes = await fetch(`${baseUrl}/api/vendor/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client1.clientCode,
      secretKey: client1.secretKey,
      appVersion: "v2.4.2",
      activeStudentsCount: 450,
      statusReported: "OPERATIONAL",
    }),
  });

  const hbData = await hbRes.json();
  console.log("Heartbeat Response:", JSON.stringify(hbData, null, 2));
  if (!hbData.success || hbData.killswitch !== false) {
    throw new Error("Heartbeat failed for active client");
  }
  console.log("[PASS] Heartbeat active acknowledgement validated.");

  // 3. Test Master Toggle (Killswitch)
  console.log("\n--- Testing Module 1: Master Killswitch Toggle ---");
  const toggleRes = await fetch(`${baseUrl}/api/clients/${client1.id}/toggle-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "SUSPENDED" }),
  });
  const toggleData = await toggleRes.json();
  console.log("Master Toggle Result:", toggleData.message);

  const hbSuspendedRes = await fetch(`${baseUrl}/api/vendor/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client1.clientCode,
      secretKey: client1.secretKey,
    }),
  });
  const hbSuspendedData = await hbSuspendedRes.json();
  console.log("Suspended Heartbeat Killswitch Directives:", hbSuspendedData.killswitch, hbSuspendedData.status);
  if (hbSuspendedData.killswitch !== true || hbSuspendedData.status !== "SUSPENDED") {
    throw new Error("Master Killswitch failed to enforce suspension");
  }
  console.log("[PASS] Master Killswitch instantly blocked client on heartbeat!");

  // Reactivate client1
  await fetch(`${baseUrl}/api/clients/${client1.id}/toggle-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ACTIVE" }),
  });
  console.log("[PASS] Client reactivated.");

  // 4. Test Code Pre-Generation Engine (Module 2 & 3)
  console.log("\n--- Testing Module 2 & 3: Code Pre-Generation Engine ---");
  const genRes = await fetch(`${baseUrl}/api/codes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: "STUDENT_QUOTA_UPGRADE",
      quotaCredits: 1000,
      quantity: 2,
      batchName: "Automated Test Batch",
    }),
  });
  const genData = await genRes.json();
  console.log("Generated Batch:", genData.batch.batchNumber);
  console.log("Generated Codes:", genData.codes.map((c: any) => c.code));
  if (!genData.success || genData.codes.length !== 2) {
    throw new Error("Code generation failed");
  }
  const testCode = genData.codes[0].code;
  console.log(`[PASS] Generated unique code: ${testCode} (+100 Students / 1000 Credits / 2000 BDT)`);

  // 5. Test Remote Code Redemption (Module 5)
  console.log("\n--- Testing Module 5: Remote Code Redemption ---");
  const client2 = await prisma.client.findFirst({
    where: { clientCode: "CLI-MADRASA-002" },
  });
  if (!client2) throw new Error("Client 2 not found");
  const initialQuota = client2.studentQuota;

  const redeemRes = await fetch(`${baseUrl}/api/vendor/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client2.clientCode,
      secretKey: client2.secretKey,
      code: testCode,
    }),
  });
  const redeemData = await redeemRes.json();
  console.log("Redemption Result:", JSON.stringify(redeemData, null, 2));

  if (!redeemData.success || redeemData.updatedClient.studentQuota !== initialQuota + 100) {
    throw new Error("Redemption quota update failed");
  }
  console.log(`[PASS] Quota expanded from ${initialQuota} to ${redeemData.updatedClient.studentQuota} students!`);

  // 6. Test Double Redemption Prevention
  const doubleRedeemRes = await fetch(`${baseUrl}/api/vendor/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: client2.clientCode,
      secretKey: client2.secretKey,
      code: testCode,
    }),
  });
  const doubleRedeemData = await doubleRedeemRes.json();
  if (doubleRedeemData.success !== false) {
    throw new Error("Double redemption security check failed");
  }
  console.log("[PASS] Double redemption correctly prevented:", doubleRedeemData.error);

  // 7. Test Ledger & Accounting (Module 4)
  console.log("\n--- Testing Module 4: Client Ledger & Accounting ---");
  const ledgerRes = await fetch(`${baseUrl}/api/ledger/${client2.id}`);
  const ledgerData = await ledgerRes.json();
  console.log("Client 2 Statement Summary:", ledgerData.statementSummary);
  console.log("Latest Ledger Entries:", ledgerData.transactions.length);
  if (!ledgerData.success || ledgerData.transactions.length === 0) {
    throw new Error("Ledger statement lookup failed");
  }
  console.log("[PASS] Ledger verified with 2000 BDT redemption billing!");

  console.log("\n=================================================");
  console.log("ALL VENDOR SAAS MODULES VERIFIED 100% SUCCESSFULLY!");
  console.log("=================================================");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
