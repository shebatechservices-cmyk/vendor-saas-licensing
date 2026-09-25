import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllData() {
  console.log("Deleting all records from database...");

  // Delete child records first to satisfy foreign keys
  const deletedHeartbeats = await prisma.heartbeatLog.deleteMany({});
  const deletedLedgers = await prisma.vendorLedger.deleteMany({});
  const deletedQuotas = await prisma.appQuota.deleteMany({});
  const deletedCodes = await prisma.licenseCode.deleteMany({});
  const deletedBatches = await prisma.batchGeneration.deleteMany({});
  const deletedClients = await prisma.client.deleteMany({});

  console.log(`[CLEARED] Heartbeat Logs: ${deletedHeartbeats.count}`);
  console.log(`[CLEARED] Ledger Entries: ${deletedLedgers.count}`);
  console.log(`[CLEARED] App Quotas: ${deletedQuotas.count}`);
  console.log(`[CLEARED] License Codes: ${deletedCodes.count}`);
  console.log(`[CLEARED] Batches: ${deletedBatches.count}`);
  console.log(`[CLEARED] Clients: ${deletedClients.count}`);
  console.log("All test data has been completely removed. Database is now empty and fresh.");
}

clearAllData()
  .catch((e) => {
    console.error("Failed to clear data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
