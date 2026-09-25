import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/middlewares/error.middleware";

export class StatsController {
  /**
   * GET /api/stats
   * Aggregates global dashboard telemetry, clients, trials, grace periods, codes, and security alerts
   */
  static async getDashboardStats(req: NextRequest) {
    try {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Client counts
      const totalClients = await prisma.client.count();
      const activeClients = await prisma.client.count({ where: { status: "ACTIVE" } });
      const blockedClients = await prisma.client.count({
        where: {
          OR: [{ status: "BLOCKED" }, { status: "SUSPENDED" }],
        },
      });
      const expiredClients = await prisma.client.count({ where: { status: "EXPIRED" } });

      // Feature 1: Active Trials & Expiring Soon (1-3 days)
      const activeTrials = await prisma.client.count({
        where: {
          OR: [
            { isTrial: true },
            { status: "TRIAL" },
            { licenseCategory: "TRIAL" },
          ],
        },
      });

      const expiringSoon = await prisma.client.count({
        where: {
          isLifetime: false,
          status: { in: ["ACTIVE", "TRIAL", "PENDING"] },
          licenseExpiresAt: {
            gt: now,
            lte: threeDaysFromNow,
          },
        },
      });

      // Live Connectivity Monitoring (10-minute online window)
      const onlineClients = await prisma.client.count({
        where: {
          OR: [
            { lastHeartbeatAt: { gt: tenMinutesAgo } },
            { last_sync: { gt: tenMinutesAgo } },
          ],
        },
      });

      const onlineLicenses = await prisma.license.count({
        where: {
          OR: [
            { last_heartbeat: { gt: tenMinutesAgo } },
            { last_sync: { gt: tenMinutesAgo } },
          ],
        },
      });

      const inGracePeriodClients = await prisma.client.count({
        where: {
          lastHeartbeatAt: {
            lte: tenMinutesAgo,
            gte: fortyEightHoursAgo,
          },
        },
      });

      const criticalOfflineClients = await prisma.client.count({
        where: {
          OR: [
            { lastHeartbeatAt: { lt: fortyEightHoursAgo } },
            { lastHeartbeatAt: null },
          ],
        },
      });

      // Codes & Quotas
      const totalCodes = await prisma.licenseCode.count();
      const availableCodes = await prisma.licenseCode.count({ where: { status: "AVAILABLE" } });
      const usedCodes = await prisma.licenseCode.count({ where: { status: "USED" } });
      const assignedCodes = await prisma.licenseCode.count({ where: { status: "ASSIGNED" } });

      const quotaAggregate = await prisma.appQuota.aggregate({
        _sum: {
          totalStudents: true,
          usedStudents: true,
          totalCreditsPurchased: true,
        },
      });

      const ledgerAggregate = await prisma.vendorLedger.aggregate({
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      });

      const totalBilledBdt = ledgerAggregate._sum.debitAmount || 0;
      const totalPaidBdt = ledgerAggregate._sum.creditAmount || 0;
      const totalOutstandingDuesBdt = Math.max(0, totalBilledBdt - totalPaidBdt);

      // Unified Heartbeat Telemetry Feed (Clients + Licenses that pinged recently)
      const recentClientHeartbeats = await prisma.heartbeatLog.findMany({
        include: {
          client: {
            select: { name: true, clientCode: true, status: true, live_status: true, last_sync: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      const recentLicensePings = await prisma.license.findMany({
        where: {
          OR: [
            { last_sync: { not: null } },
            { last_heartbeat: { not: null } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      });

      // Normalize into unified telemetry stream
      const unifiedFeed = [
        ...recentClientHeartbeats.map((hb) => ({
          id: hb.id,
          source: "CLIENT_APP",
          clientName: hb.client?.name || "Client Application",
          clientCode: hb.client?.clientCode,
          ipAddress: hb.ipAddress || "127.0.0.1",
          appVersion: hb.appVersion || "v2.4.x",
          activeStudentsCount: hb.activeStudentsCount,
          statusReported: hb.statusReported || "OPERATIONAL",
          live_status: hb.client?.live_status || "ONLINE",
          createdAt: hb.createdAt,
          last_sync: hb.client?.last_sync || hb.createdAt,
          isOnlineWithin10m: hb.createdAt > tenMinutesAgo,
        })),
        ...recentLicensePings.map((lic) => {
          const lastPing = lic.last_sync || lic.last_heartbeat || lic.updatedAt;
          const isOnlineWithin10m = lastPing > tenMinutesAgo;
          return {
            id: lic.id,
            source: "LICENSE_KEY",
            clientName: lic.client_name,
            clientCode: lic.license_key,
            ipAddress: lic.ip_address || "127.0.0.1",
            appVersion: lic.app_version || "v2.4.x",
            activeStudentsCount: null,
            statusReported: lic.status === "Active" ? "OPERATIONAL" : lic.status.toUpperCase(),
            live_status: isOnlineWithin10m ? "ONLINE" : (lic.live_status || "OFFLINE"),
            createdAt: lastPing,
            last_sync: lastPing,
            isOnlineWithin10m,
          };
        }),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

      const availableByCategory = await prisma.licenseCode.groupBy({
        by: ["category"],
        where: { status: "AVAILABLE" },
        _count: true,
        _sum: { priceBdt: true },
      });

      // Feature 4: Security Alerts Telemetry
      const alerts = await prisma.securityAlert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return NextResponse.json({
        success: true,
        stats: {
          clients: {
            total: totalClients + (await prisma.license.count()),
            totalClients,
            active: activeClients,
            blocked: blockedClients,
            suspended: blockedClients,
            expired: expiredClients,
            online: onlineClients + onlineLicenses,
            onlineClients,
            onlineLicenses,
            activeTrials,
            expiringSoon,
            inGracePeriod: inGracePeriodClients,
            criticalOffline: criticalOfflineClients,
          },
          codes: {
            total: totalCodes,
            available: availableCodes,
            used: usedCodes,
            assigned: assignedCodes,
            availableByCategory,
          },
          students: {
            totalSlots: quotaAggregate._sum.totalStudents || 0,
            activeEnrolled: quotaAggregate._sum.usedStudents || 0,
            totalCreditsSold: quotaAggregate._sum.totalCreditsPurchased || 0,
          },
          finance: {
            totalBilledBdt,
            totalPaidBdt,
            totalOutstandingDuesBdt,
          },
          recentHeartbeats: unifiedFeed,
          securityAlerts: alerts,
        },
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to retrieve dashboard stats");
    }
  }
}
