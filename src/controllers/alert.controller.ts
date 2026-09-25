import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/middlewares/error.middleware";

export class AlertController {
  /**
   * GET /api/alerts
   * Returns list of security alerts
   */
  static async getAlerts(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const includeResolved = searchParams.get("all") === "true";
      const limit = parseInt(searchParams.get("limit") || "20", 10);

      const where = includeResolved ? {} : { resolved: false };

      const alerts = await prisma.securityAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        alerts,
        unresolvedCount: alerts.filter((a) => !a.resolved).length,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to fetch security alerts");
    }
  }

  /**
   * POST /api/alerts
   * Creates a security alert
   */
  static async createAlert(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const { type = "UNAUTHORIZED_REQUEST", severity = "HIGH", title, description, clientCode, ipAddress } = body;

      if (!title || !description) {
        return NextResponse.json(
          { success: false, error: "Title and description are required for security alert." },
          { status: 400 }
        );
      }

      const clientIp = ipAddress || req.headers.get("x-forwarded-for") || "127.0.0.1";

      const alert = await prisma.securityAlert.create({
        data: {
          type,
          severity,
          title,
          description,
          clientCode: clientCode || null,
          ipAddress: clientIp.split(",")[0].trim(),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Security alert logged successfully",
          alert,
        },
        { status: 201 }
      );
    } catch (error: any) {
      return handleApiError(error, "Failed to create security alert");
    }
  }

  /**
   * POST /api/alerts/[id]/dismiss or PATCH /api/alerts/[id]
   * Dismisses / resolves an alert
   */
  static async dismissAlert(id: string) {
    try {
      const alert = await prisma.securityAlert.findUnique({
        where: { id },
      });

      if (!alert) {
        return NextResponse.json(
          { success: false, error: "Alert not found" },
          { status: 404 }
        );
      }

      const updated = await prisma.securityAlert.update({
        where: { id },
        data: { resolved: true },
      });

      return NextResponse.json({
        success: true,
        message: "Security alert dismissed successfully.",
        alert: updated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to dismiss security alert");
    }
  }
}
