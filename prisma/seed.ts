import { PrismaClient } from "@prisma/client";
import { generateRandomCode, mapToValidityType } from "../src/lib/code-generator";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all test and dummy data...");

  // Clear existing
  await prisma.heartbeatLog.deleteMany({});
  await prisma.vendorLedger.deleteMany({});
  await prisma.appQuota.deleteMany({});
  await prisma.licenseCode.deleteMany({});
  await prisma.batchGeneration.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.securityAlert.deleteMany({});

  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  console.log("🚀 Creating Production Client & License for sdb.shebatechnologybd.com...");

  // 1. Production Client: Sheba Technology & Networking
  const client = await prisma.client.create({
    data: {
      clientCode: "CLIENT-SHEBA-TECH-8801",
      name: "Sheba Technology & Networking",
      contactPerson: "Sheba Dev Core Team",
      email: "shebatechservices@gmail.com",
      phone: "+8801722578860",
      domain: "sdb.shebatechnologybd.com",
      appType: "Sheba POS & ERP Suite",
      status: "ACTIVE",
      secretKey: "sec_sheba_tech_enterprise_2026_vendor_auth",
      licenseCategory: "APP_LICENSE",
      isLifetime: false,
      licenseExpiresAt: oneYearFromNow,
      hostingExpiresAt: oneYearFromNow,
      domainExpiresAt: oneYearFromNow,
      studentQuota: 500,
      storageQuotaGb: 10.0,
      lastHeartbeatAt: now,
      last_sync: now,
      live_status: "ONLINE",
      lastPingIp: "103.145.120.45",
      lastAppVersion: "16.9.26",
      lastStatusReported: "OPERATIONAL",
      isOnline: true,
      quotas: {
        create: {
          baseStudents: 500,
          extraStudents: 0,
          totalStudents: 500,
          usedStudents: 29,
          totalCreditsPurchased: 5000,
          totalCreditsUsed: 5000,
          availableCredits: 0,
          storageMb: 10240,
        },
      },
    },
  });

  // 2. Production Commercial License
  const license = await prisma.license.create({
    data: {
      client_name: "Sheba Technology & Networking",
      license_key: "SHEBA-ENT-2026-X99-PRO",
      mac_address: "CC38C810B5EA9B4A39847B7FF8220CE9",
      expiry_date: oneYearFromNow,
      status: "Active",
      live_status: "ONLINE",
      app_version: "16.9.26",
      last_heartbeat: now,
      last_sync: now,
      ip_address: "103.145.120.45",
    },
  });

  // 3. Initial Ledger Record
  await prisma.vendorLedger.create({
    data: {
      clientId: client.id,
      transactionType: "BILLING",
      amountBdt: 25000,
      debitAmount: 25000,
      creditAmount: 0,
      runningBalanceBdt: 25000,
      description: "Sheba POS & ERP Commercial Enterprise 1-Year License Activation",
      performedBy: "VENDOR_ADMIN",
      createdAt: now,
    },
  });

  await prisma.vendorLedger.create({
    data: {
      clientId: client.id,
      transactionType: "PAYMENT",
      amountBdt: -25000,
      debitAmount: 0,
      creditAmount: 25000,
      runningBalanceBdt: 0,
      description: "Payment Confirmed for Commercial Enterprise License (Ref: SHB-PRO-001)",
      paymentMethod: "Bank Transfer",
      receiptNumber: "RCT-SHEBA-2026-01",
      performedBy: "ACCOUNTS",
      createdAt: now,
    },
  });

  // 4. Initial Heartbeat & Handshake Log
  await prisma.heartbeatLog.create({
    data: {
      clientId: client.id,
      ipAddress: "103.145.120.45",
      appVersion: "16.9.26",
      domainReported: "sdb.shebatechnologybd.com",
      statusReported: "OPERATIONAL",
      activeStudentsCount: 29,
      databaseSizeMb: 14.8,
      responseDirectives: JSON.stringify({
        status: "ACTIVE",
        studentQuota: 500,
        license_key: "SHEBA-ENT-2026-X99-PRO",
        hardware_id: "CC38C810B5EA9B4A39847B7FF8220CE9",
        domain: "sdb.shebatechnologybd.com",
      }),
      createdAt: now,
    },
  });

  // 5. Pre-generate Production License Code Batches
  const enterpriseBatch = await prisma.batchGeneration.create({
    data: {
      batchNumber: "BATCH-SHEBA-PRO-2026-01",
      name: "Sheba Technology Enterprise 1-Year Licenses",
      category: "APP_LICENSE",
      validityType: "YEARS_1",
      validityYears: 1,
      quantity: 5,
      priceBdtPerUnit: 25000,
      totalValueBdt: 125000,
      notes: "Commercial Enterprise Licenses for Sheba ERP/POS Clients",
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.licenseCode.create({
      data: {
        code: generateRandomCode("SHEBA", 3, 4),
        category: "APP_LICENSE",
        validityType: "YEARS_1",
        validityYears: 1,
        isLifetime: false,
        priceBdt: 25000,
        status: "AVAILABLE",
        batchId: enterpriseBatch.id,
        note: "1-Year Enterprise Commercial License Code",
      },
    });
  }

  // 6. Quota Expansion Batch
  const quotaBatch = await prisma.batchGeneration.create({
    data: {
      batchNumber: "BATCH-QUOTA-2026-01",
      name: "Student/Branch Quota Upgrade Packs (+100 Slots)",
      category: "STUDENT_QUOTA_UPGRADE",
      validityType: "QUOTA_CREDITS",
      quotaCredits: 1000,
      studentQuotaAdded: 100,
      quantity: 5,
      priceBdtPerUnit: 2000,
      totalValueBdt: 10000,
      notes: "1000 Credits = 2000 BDT, unlocks 100 extra quota units",
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.licenseCode.create({
      data: {
        code: generateRandomCode("QUOTA", 3, 4),
        category: "STUDENT_QUOTA_UPGRADE",
        validityType: "QUOTA_CREDITS",
        quotaCredits: 1000,
        studentQuotaAdded: 100,
        priceBdt: 2000,
        status: "AVAILABLE",
        batchId: quotaBatch.id,
        note: "+100 Quota Capacity Pack (1000 Credits)",
      },
    });
  }

  console.log("✅ Successfully purged test data and configured production client & license for sdb.shebatechnologybd.com!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
