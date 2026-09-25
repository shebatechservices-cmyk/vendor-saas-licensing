import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { handleApiError, handleSuccess } from "@/middlewares/error.middleware";

export class ClientController {
  /**
   * GET /api/clients
   * Returns list of clients with live connectivity and calculated accounting dues
   */
  static async getAllClients(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const search = searchParams.get("search");

      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { clientCode: { contains: search } },
          { domain: { contains: search } },
          { email: { contains: search } },
        ];
      }

      const clients = await prisma.client.findMany({
        where,
        include: {
          quotas: true,
          ledgerEntries: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              redeemedCodes: true,
              heartbeats: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const clientsWithDues = await Promise.all(
        clients.map(async (client) => {
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

          const isTrial = client.isTrial || client.status === "TRIAL" || (client as any).licenseCategory === "TRIAL";

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
        })
      );

      return NextResponse.json({ success: true, clients: clientsWithDues });
    } catch (error: any) {
      return handleApiError(error, "Failed to fetch clients");
    }
  }

  /**
   * GET /api/clients/[id]
   * Returns deep telemetry and statement for a specific client
   */
  static async getClientById(id: string) {
    try {
      const client = await prisma.client.findFirst({
        where: {
          OR: [{ id }, { clientCode: id }],
        },
        include: {
          quotas: true,
          ledgerEntries: {
            orderBy: { createdAt: "desc" },
          },
          redeemedCodes: {
            orderBy: { redeemedAt: "desc" },
          },
          heartbeats: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }

      const latestLedger = await prisma.vendorLedger.findFirst({
        where: { clientId: client.id },
        orderBy: { createdAt: "desc" },
      });

      const duesSummary = await prisma.vendorLedger.aggregate({
        where: { clientId: client.id },
        _sum: { debitAmount: true, creditAmount: true },
      });

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const isOnline = client.lastHeartbeatAt ? client.lastHeartbeatAt > tenMinutesAgo : false;

      return NextResponse.json({
        success: true,
        client: {
          ...client,
          isOnline,
          currentDueBdt: latestLedger ? latestLedger.runningBalanceBdt : 0,
          totalBilledBdt: duesSummary._sum.debitAmount || 0,
          totalPaidBdt: duesSummary._sum.creditAmount || 0,
        },
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to get client");
    }
  }

  /**
   * POST /api/clients
   * Registers a new tenant application
   */
  static async createClient(req: NextRequest) {
    try {
      const body = await req.json();
      const {
        name,
        contactPerson,
        email,
        phone,
        domain,
        appType = "Madrasa/School Management App",
        initialStudentQuota = 200,
        storageQuotaGb = 5.0,
        licenseYears = 1,
        isLifetime = false,
      } = body;

      if (!name) {
        return NextResponse.json(
          { success: false, error: "Institution / Organization name is required" },
          { status: 400 }
        );
      }

      const codeSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      const clientCode = `CLI-APP-${codeSuffix}`;
      const secretKey = `sec_${crypto.randomBytes(12).toString("hex")}`;

      const now = new Date();
      const licenseExpiry = isLifetime
        ? null
        : new Date(now.getFullYear() + (licenseYears || 1), now.getMonth(), now.getDate());

      const client = await prisma.client.create({
        data: {
          clientCode,
          name,
          contactPerson,
          email,
          phone,
          domain,
          appType,
          status: "ACTIVE",
          secretKey,
          isLifetime: !!isLifetime,
          licenseExpiresAt: licenseExpiry,
          hostingExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
          domainExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
          studentQuota: initialStudentQuota || 200,
          storageQuotaGb: storageQuotaGb || 5.0,
          quotas: {
            create: {
              baseStudents: initialStudentQuota || 200,
              extraStudents: 0,
              totalStudents: initialStudentQuota || 200,
              usedStudents: 0,
              totalCreditsPurchased: 0,
              availableCredits: 0,
            },
          },
        },
        include: {
          quotas: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Client application registered successfully.",
        client,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to create client");
    }
  }

  /**
   * PUT /api/clients/[id]
   * Updates client metadata, quotas, or service expiry dates
   */
  static async updateClient(id: string, req: NextRequest) {
    try {
      const body = await req.json();
      const {
        name,
        contactPerson,
        email,
        phone,
        domain,
        status,
        isLifetime,
        licenseExpiresAt,
        hostingExpiresAt,
        domainExpiresAt,
        studentQuota,
        storageQuotaGb,
      } = body;

      const updated = await prisma.client.update({
        where: { id },
        data: {
          name,
          contactPerson,
          email,
          phone,
          domain,
          status,
          isLifetime: isLifetime !== undefined ? isLifetime : undefined,
          licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : undefined,
          hostingExpiresAt: hostingExpiresAt ? new Date(hostingExpiresAt) : undefined,
          domainExpiresAt: domainExpiresAt ? new Date(domainExpiresAt) : undefined,
          studentQuota: studentQuota !== undefined ? parseInt(studentQuota, 10) : undefined,
          storageQuotaGb: storageQuotaGb !== undefined ? parseFloat(storageQuotaGb) : undefined,
        },
        include: {
          quotas: true,
        },
      });

      if (studentQuota !== undefined) {
        await prisma.appQuota.updateMany({
          where: { clientId: id },
          data: {
            totalStudents: parseInt(studentQuota, 10),
            lastUpdated: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Client details updated successfully.",
        client: updated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to update client");
    }
  }

  /**
   * POST /api/clients/[id]/toggle-status
   * Instant Master Toggle / Kill-switch / Block action
   */
  static async toggleClientStatus(id: string, req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const targetStatus = body.status; // "ACTIVE" | "BLOCKED" | "SUSPENDED" | "EXPIRED"

      const client = await prisma.client.findUnique({
        where: { id },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }

      let newStatus = targetStatus;
      if (!newStatus) {
        newStatus = client.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
      }

      const updated = await prisma.client.update({
        where: { id },
        data: {
          status: newStatus,
          lastStatusReported:
            newStatus === "BLOCKED" || newStatus === "SUSPENDED"
              ? "BLOCKED_BY_VENDOR"
              : "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Client ${updated.name} (${updated.clientCode}) status changed to ${newStatus}.`,
        client: updated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to toggle client status");
    }
  }

  /**
   * POST /api/clients/[id]/extend-trial
   * Extends trial period (default: +7 days)
   */
  static async extendTrial(id: string, req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const days = parseInt(body.days || "7", 10);

      const client = await prisma.client.findFirst({
        where: { OR: [{ id }, { clientCode: id }] },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }

      const now = new Date();
      const baseDate =
        client.trialEndsAt && client.trialEndsAt > now
          ? client.trialEndsAt
          : client.licenseExpiresAt && client.licenseExpiresAt > now
          ? client.licenseExpiresAt
          : now;

      const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: {
          isTrial: true,
          status: "ACTIVE",
          trialEndsAt: newExpiry,
          licenseExpiresAt: newExpiry,
          lastStatusReported: "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Trial for ${updated.name} successfully extended by ${days} days (Expires: ${newExpiry.toLocaleDateString()}).`,
        client: updated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to extend trial");
    }
  }

  /**
   * POST /api/clients/[id]/renew
   * Renews license (default: +1 year / 365 days)
   */
  static async renewLicense(id: string, req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const years = parseInt(body.years || "1", 10);
      const isLifetime = !!body.isLifetime;

      const client = await prisma.client.findFirst({
        where: { OR: [{ id }, { clientCode: id }] },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }

      const now = new Date();
      let newExpiry: Date | null = null;
      if (!isLifetime) {
        const baseDate =
          client.licenseExpiresAt && client.licenseExpiresAt > now
            ? client.licenseExpiresAt
            : now;
        newExpiry = new Date(baseDate.getTime());
        newExpiry.setFullYear(newExpiry.getFullYear() + years);
      }

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: {
          isLifetime: isLifetime || client.isLifetime,
          isTrial: false,
          status: "ACTIVE",
          licenseExpiresAt: isLifetime ? null : newExpiry,
          lastStatusReported: "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        message: `License for ${updated.name} renewed successfully ${isLifetime ? "for Lifetime" : `for ${years} year(s)`}.`,
        client: updated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to renew license");
    }
  }

  /**
   * POST /api/clients/[id]/force-block
   * Forces instant block / kill-switch activation
   */
  static async forceBlock(id: string, req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const reason = body.reason || "Force blocked by Vendor Administrator";

      const client = await prisma.client.findFirst({
        where: { OR: [{ id }, { clientCode: id }] },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: {
          status: "BLOCKED",
          lastStatusReported: "BLOCKED_BY_VENDOR",
        },
      });

      // Also create a SecurityAlert for audit trail
      const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await prisma.securityAlert.create({
        data: {
          type: "FORCE_BLOCK",
          severity: "HIGH",
          title: `Client App Force Blocked: ${updated.name}`,
          description: `Master Killswitch triggered for ${updated.name} (${updated.clientCode}). Reason: ${reason}`,
          clientCode: updated.clientCode,
          ipAddress: clientIp.split(",")[0].trim(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Client ${updated.name} (${updated.clientCode}) has been forcefully blocked.`,
        client: updated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to force block client");
    }
  }

  /**
   * DELETE /api/clients/[id]
   */
  static async deleteClient(id: string) {
    try {
      await prisma.client.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Client deleted successfully.",
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to delete client");
    }
  }
}

