import { prisma } from "@/lib/prisma";

export interface EnrichedClient {
  id: string;
  clientCode: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  domain: string | null;
  appType: string;
  status: string;
  secretKey: string;
  licenseCategory: string;
  isLifetime: boolean;
  isTrial: boolean;
  trialEndsAt: Date | null;
  gracePeriodHours: number;
  licenseExpiresAt: Date | null;
  hostingExpiresAt: Date | null;
  domainExpiresAt: Date | null;
  studentQuota: number;
  storageQuotaGb: number;
  lastHeartbeatAt: Date | null;
  last_sync: Date | null;
  live_status: string | null;
  lastPingIp: string | null;
  lastAppVersion: string | null;
  isOnline: boolean;
  inGracePeriod: boolean;
  isCriticalOffline: boolean;
  graceRemainingHours: number;
  isExpiringSoon: boolean;
  currentDueBdt: number;
  totalBilledBdt: number;
  totalPaidBdt: number;
  quotas?: any;
  ledgerEntries?: any[];
  _count?: any;
}

export class ClientManagementService {
  /**
   * Enriches raw Prisma Client models with live status, grace metrics, and accounting dues
   */
  static async enrichClient(client: any): Promise<EnrichedClient> {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const latestLedger = await prisma.vendorLedger.findFirst({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    const totalBilled = await prisma.vendorLedger.aggregate({
      where: { clientId: client.id },
      _sum: { debitAmount: true, creditAmount: true },
    });

    const isOnline = client.lastHeartbeatAt ? client.lastHeartbeatAt > tenMinutesAgo : false;
    const inGracePeriod = !isOnline && client.lastHeartbeatAt ? client.lastHeartbeatAt >= fortyEightHoursAgo : false;
    const isCriticalOffline = !client.lastHeartbeatAt || client.lastHeartbeatAt < fortyEightHoursAgo;

    let graceRemainingHours = 0;
    if (inGracePeriod && client.lastHeartbeatAt) {
      const graceDurationMs = (client.gracePeriodHours || 48) * 60 * 60 * 1000;
      const deadline = client.lastHeartbeatAt.getTime() + graceDurationMs;
      graceRemainingHours = Math.max(0, Math.round((deadline - now.getTime()) / (60 * 60 * 1000)));
    }

    const isExpiringSoon = !client.isLifetime && !!client.licenseExpiresAt &&
      client.licenseExpiresAt > now &&
      client.licenseExpiresAt <= threeDaysFromNow;

    const isTrial = client.isTrial || client.status === "TRIAL" || client.licenseCategory === "TRIAL";

    return {
      ...client,
      isOnline,
      inGracePeriod,
      isCriticalOffline,
      graceRemainingHours,
      isExpiringSoon,
      isTrial,
      currentDueBdt: latestLedger ? latestLedger.runningBalanceBdt : 0,
      totalBilledBdt: totalBilled._sum.debitAmount || 0,
      totalPaidBdt: totalBilled._sum.creditAmount || 0,
    };
  }
}
