import { PrismaClient } from "@prisma/client";
import { generateRandomCode, mapToValidityType } from "../src/lib/code-generator";
import { calculateFromCredits, calculateLicensePrice } from "../src/lib/quota-calc";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Vendor SaaS Database...");

  // Clear existing
  await prisma.heartbeatLog.deleteMany({});
  await prisma.vendorLedger.deleteMany({});
  await prisma.appQuota.deleteMany({});
  await prisma.licenseCode.deleteMany({});
  await prisma.batchGeneration.deleteMany({});
  await prisma.client.deleteMany({});

  const now = new Date();

  // 1. Create Sample Clients
  const client1 = await prisma.client.create({
    data: {
      clientCode: "CLI-MADRASA-001",
      name: "Darul Uloom International Madrasa & Academy",
      contactPerson: "Maulana Abdur Rahman",
      email: "info@darululoom-academy.edu.bd",
      phone: "+880 1711-000111",
      domain: "darululoom-academy.edu.bd",
      appType: "Madrasa/School Management App",
      status: "ACTIVE",
      secretKey: "sec_darul_uloom_98a72b10",
      licenseCategory: "APP_LICENSE",
      isLifetime: false,
      licenseExpiresAt: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
      hostingExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      domainExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      studentQuota: 500,
      storageQuotaGb: 10.0,
      lastHeartbeatAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
      lastPingIp: "103.145.120.45",
      lastAppVersion: "v2.4.1",
      lastStatusReported: "OPERATIONAL",
      isOnline: true,
      quotas: {
        create: {
          baseStudents: 200,
          extraStudents: 300,
          totalStudents: 500,
          usedStudents: 432,
          totalCreditsPurchased: 3000,
          totalCreditsUsed: 3000,
          availableCredits: 0,
        },
      },
    },
  });

  const client2 = await prisma.client.create({
    data: {
      clientCode: "CLI-MADRASA-002",
      name: "Al-Huda Model School & Hifz Madrasa",
      contactPerson: "Hafiz Mahbubul Alam",
      email: "principal@alhuda-model.edu.bd",
      phone: "+880 1822-334455",
      domain: "alhuda-model.edu.bd",
      appType: "Madrasa/School Management App",
      status: "ACTIVE",
      secretKey: "sec_alhuda_model_33f91c84",
      licenseCategory: "APP_LICENSE",
      isLifetime: false,
      licenseExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      hostingExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      domainExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      studentQuota: 300,
      storageQuotaGb: 5.0,
      lastHeartbeatAt: new Date(Date.now() - 8 * 60 * 1000), // 8 mins ago
      lastPingIp: "118.67.210.12",
      lastAppVersion: "v2.4.0",
      lastStatusReported: "OPERATIONAL",
      isOnline: true,
      quotas: {
        create: {
          baseStudents: 200,
          extraStudents: 100,
          totalStudents: 300,
          usedStudents: 285,
          totalCreditsPurchased: 1000,
          totalCreditsUsed: 1000,
          availableCredits: 0,
        },
      },
    },
  });

  const client3 = await prisma.client.create({
    data: {
      clientCode: "CLI-SCHOOL-003",
      name: "Baitul Hikmah Secondary High School",
      contactPerson: "Md. Tareq Hasan",
      email: "admin@baitulhikmah-school.edu.bd",
      phone: "+880 1933-778899",
      domain: "baitulhikmah-school.edu.bd",
      appType: "Madrasa/School Management App",
      status: "SUSPENDED", // Suspended via Master Toggle
      secretKey: "sec_baitul_hikmah_77e44a99",
      licenseCategory: "APP_LICENSE",
      isLifetime: false,
      licenseExpiresAt: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      hostingExpiresAt: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      domainExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      studentQuota: 200,
      storageQuotaGb: 5.0,
      lastHeartbeatAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      lastPingIp: "103.205.71.90",
      lastAppVersion: "v2.3.8",
      lastStatusReported: "SUSPENDED_BY_VENDOR",
      isOnline: false,
      quotas: {
        create: {
          baseStudents: 200,
          extraStudents: 0,
          totalStudents: 200,
          usedStudents: 198,
          totalCreditsPurchased: 0,
          totalCreditsUsed: 0,
          availableCredits: 0,
        },
      },
    },
  });

  const client4 = await prisma.client.create({
    data: {
      clientCode: "CLI-MADRASA-004",
      name: "Sirajia Islamic Cadet Complex",
      contactPerson: "Dr. Mufti Sirajul Islam",
      email: "director@sirajia-cadet.edu.bd",
      phone: "+880 1611-998877",
      domain: "sirajia-cadet.edu.bd",
      appType: "Madrasa/School Management App",
      status: "ACTIVE",
      secretKey: "sec_sirajia_complex_12d55b77",
      licenseCategory: "APP_LICENSE",
      isLifetime: true,
      licenseExpiresAt: null, // Lifetime
      hostingExpiresAt: new Date(now.getFullYear() + 3, now.getMonth(), now.getDate()),
      domainExpiresAt: new Date(now.getFullYear() + 3, now.getMonth(), now.getDate()),
      studentQuota: 1000,
      storageQuotaGb: 25.0,
      lastHeartbeatAt: new Date(Date.now() - 1 * 60 * 1000), // 1 min ago
      lastPingIp: "202.134.8.19",
      lastAppVersion: "v2.4.1",
      lastStatusReported: "OPERATIONAL",
      isOnline: true,
      quotas: {
        create: {
          baseStudents: 200,
          extraStudents: 800,
          totalStudents: 1000,
          usedStudents: 740,
          totalCreditsPurchased: 8000,
          totalCreditsUsed: 8000,
          availableCredits: 0,
        },
      },
    },
  });

  // 2. Initial Ledger Entries
  // Client 1: Billed 20,000 (2 yr license) + 6,000 (300 quota = 3000 credits = 6000 BDT) = 26,000. Paid 20,000. Due = 6,000.
  await prisma.vendorLedger.createMany({
    data: [
      {
        clientId: client1.id,
        transactionType: "BILLING",
        amountBdt: 20000,
        debitAmount: 20000,
        creditAmount: 0,
        runningBalanceBdt: 20000,
        description: "2-Year App License Billing",
        performedBy: "ADMIN",
        createdAt: new Date(Date.now() - 30 * 86400000),
      },
      {
        clientId: client1.id,
        transactionType: "BILLING",
        amountBdt: 6000,
        debitAmount: 6000,
        creditAmount: 0,
        runningBalanceBdt: 26000,
        description: "Student Quota Upgrade (+300 Students / 3000 Credits)",
        performedBy: "ADMIN",
        createdAt: new Date(Date.now() - 15 * 86400000),
      },
      {
        clientId: client1.id,
        transactionType: "PAYMENT",
        amountBdt: -20000,
        debitAmount: 0,
        creditAmount: 20000,
        runningBalanceBdt: 6000,
        description: "Payment received via Bank Transfer (Ref: TRN-99882)",
        paymentMethod: "Bank Transfer",
        receiptNumber: "RCT-2026-0041",
        performedBy: "ACCOUNTS",
        createdAt: new Date(Date.now() - 10 * 86400000),
      },
    ],
  });

  // Client 3: Suspended due to unpaid billings
  await prisma.vendorLedger.create({
    data: {
      clientId: client3.id,
      transactionType: "BILLING",
      amountBdt: 12000,
      debitAmount: 12000,
      creditAmount: 0,
      runningBalanceBdt: 12000,
      description: "Annual License Renewal (Unpaid)",
      performedBy: "SYSTEM",
      createdAt: new Date(Date.now() - 40 * 86400000),
    },
  });

  // 3. Heartbeat Logs
  await prisma.heartbeatLog.createMany({
    data: [
      {
        clientId: client1.id,
        ipAddress: "103.145.120.45",
        appVersion: "v2.4.1",
        domainReported: "darululoom-academy.edu.bd",
        statusReported: "OPERATIONAL",
        activeStudentsCount: 432,
        databaseSizeMb: 142.5,
        responseDirectives: JSON.stringify({ status: "ACTIVE", studentQuota: 500 }),
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        clientId: client2.id,
        ipAddress: "118.67.210.12",
        appVersion: "v2.4.0",
        domainReported: "alhuda-model.edu.bd",
        statusReported: "OPERATIONAL",
        activeStudentsCount: 285,
        databaseSizeMb: 89.2,
        responseDirectives: JSON.stringify({ status: "ACTIVE", studentQuota: 300 }),
        createdAt: new Date(Date.now() - 8 * 60 * 1000),
      },
      {
        clientId: client3.id,
        ipAddress: "103.205.71.90",
        appVersion: "v2.3.8",
        domainReported: "baitulhikmah-school.edu.bd",
        statusReported: "SUSPENDED_BY_VENDOR",
        activeStudentsCount: 198,
        databaseSizeMb: 54.1,
        responseDirectives: JSON.stringify({ status: "SUSPENDED", killswitch: true }),
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
    ],
  });

  // 4. Batch Pre-generation: Student Quota Upgrade Codes
  // 1000 credits = 2000 BDT = 100 students
  const quotaBatch = await prisma.batchGeneration.create({
    data: {
      batchNumber: "BATCH-QUOTA-2026-01",
      name: "Q1 2026 Madrasa Student Quota Upgrades (+100 Students)",
      category: "STUDENT_QUOTA_UPGRADE",
      validityType: "QUOTA_CREDITS",
      quotaCredits: 1000,
      studentQuotaAdded: 100,
      quantity: 5,
      priceBdtPerUnit: 2000,
      totalValueBdt: 10000,
      notes: "1000 Credits = 2000 BDT, unlocks 100 extra student slots",
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
        note: "+100 Students Quota Expansion (1000 Credits)",
      },
    });
  }

  // 5. Batch Pre-generation: App License Codes (1-3 Years & Lifetime)
  const licenseBatch = await prisma.batchGeneration.create({
    data: {
      batchNumber: "BATCH-LIC-2026-01",
      name: "Madrasa Software Standard Annual Licenses",
      category: "APP_LICENSE",
      validityType: "YEARS_1",
      validityYears: 1,
      quantity: 5,
      priceBdtPerUnit: 10000,
      totalValueBdt: 50000,
    },
  });

  for (let i = 1; i <= 5; i++) {
    const years = i <= 3 ? i : (i === 4 ? 5 : null);
    const isLifetime = i === 5;
    const price = isLifetime ? 75000 : (years! * 10000);
    const valType = mapToValidityType(years, isLifetime, false);

    await prisma.licenseCode.create({
      data: {
        code: generateRandomCode("LIC", 3, 4),
        category: "APP_LICENSE",
        validityType: valType,
        validityYears: years,
        isLifetime,
        priceBdt: price,
        status: "AVAILABLE",
        batchId: licenseBatch.id,
        note: isLifetime ? "Full Lifetime Madrasa App License" : `${years}-Year Full App License`,
      },
    });
  }

  // 6. Hosting & Domain Codes
  for (let i = 1; i <= 3; i++) {
    await prisma.licenseCode.create({
      data: {
        code: generateRandomCode("HOST", 3, 4),
        category: "HOSTING_RENEWAL",
        validityType: "YEARS_1",
        validityYears: 1,
        priceBdt: 5000,
        status: "AVAILABLE",
        note: "1-Year Cloud Hosting Renewal",
      },
    });

    await prisma.licenseCode.create({
      data: {
        code: generateRandomCode("DOM", 3, 4),
        category: "DOMAIN_RENEWAL",
        validityType: "YEARS_1",
        validityYears: 1,
        priceBdt: 1500,
        status: "AVAILABLE",
        note: "1-Year .edu.bd / .com Domain Renewal",
      },
    });
  }

  console.log("Database seeded successfully with clients, pre-generated codes, quotas, and ledger!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
