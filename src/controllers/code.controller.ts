import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/middlewares/error.middleware";
import { LicenseController } from "./license.controller";

export class CodeController {
  /**
   * GET /api/codes
   * Queries and filters pre-generated codes
   */
  static async getCodes(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get("category");
      const status = searchParams.get("status");
      const search = searchParams.get("search");
      const batchId = searchParams.get("batchId");

      const where: any = {};
      if (category && category !== "ALL") {
        where.category = category;
      }
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (batchId) {
        where.batchId = batchId;
      }
      if (search) {
        where.OR = [
          { code: { contains: search } },
          { note: { contains: search } },
          { assignedClient: { name: { contains: search } } },
          { redeemedClient: { name: { contains: search } } },
        ];
      }

      const codes = await prisma.licenseCode.findMany({
        where,
        include: {
          assignedClient: {
            select: { id: true, clientCode: true, name: true },
          },
          redeemedClient: {
            select: { id: true, clientCode: true, name: true },
          },
          batch: {
            select: { id: true, batchNumber: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const batches = await prisma.batchGeneration.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return NextResponse.json({
        success: true,
        codes,
        batches,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to fetch codes");
    }
  }

  /**
   * POST /api/codes/generate
   */
  static async generateCodes(req: NextRequest) {
    return LicenseController.generateLicense(req);
  }

  /**
   * PATCH /api/codes
   * Assigns or revokes codes
   */
  static async updateCode(req: NextRequest) {
    try {
      const body = await req.json();
      const { codeId, status, assignedClientId, note } = body;

      if (!codeId) {
        return NextResponse.json(
          { success: false, error: "Missing codeId" },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (assignedClientId !== undefined) {
        updateData.assignedClientId = assignedClientId || null;
        if (assignedClientId && (!status || status === "AVAILABLE")) {
          updateData.status = "ASSIGNED";
        }
      }
      if (note !== undefined) updateData.note = note;

      const updated = await prisma.licenseCode.update({
        where: { id: codeId },
        data: updateData,
        include: {
          assignedClient: true,
          redeemedClient: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Code updated successfully",
        code: updated,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to update code");
    }
  }
}
