import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/middlewares/error.middleware";
import { LicenseGeneratorService } from "@/services/license-generator.service";
import { LicenseVerificationService } from "@/services/license-verification.service";
import { LicenseRedemptionService } from "@/services/license-redemption.service";

// Re-export helper for backwards compatibility
export const generateUniqueLicenseKey = (prefix?: string) => LicenseGeneratorService.generateUniqueKey(prefix);

export class LicenseController {
  /**
   * POST /api/license/generate
   * Generates a new unique client license key or batch codes
   */
  static async generateLicense(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      if (body.client_name || body.clientName) {
        const result = await LicenseGeneratorService.issueLicense(body);
        return NextResponse.json(result, { status: 201 });
      }
      if (body.category) {
        const result = await LicenseGeneratorService.issueBatch(body);
        return NextResponse.json(result, { status: 200 });
      }
      return NextResponse.json(
        { success: false, error: "client_name is required to generate a license." },
        { status: 400 }
      );
    } catch (error: any) {
      return handleApiError(error, "Failed to generate license");
    }
  }

  /**
   * POST /api/license/verify
   * Unified License validation and heartbeat endpoint
   */
  static async verifyLicense(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const result = await LicenseVerificationService.verify(req, body);
      return NextResponse.json(result.payload, { status: result.statusCode });
    } catch (error: any) {
      return handleApiError(error, "Verification failed");
    }
  }

  /**
   * POST /api/license/heartbeat
   * Dedicated live heartbeat telemetry endpoint saving last_sync and live_status
   */
  static async heartbeat(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const result = await LicenseVerificationService.processHeartbeat(req, body);
      return NextResponse.json(result.payload, { status: result.statusCode });
    } catch (error: any) {
      return handleApiError(error, "Failed to process heartbeat");
    }
  }

  /**
   * POST /api/license/update-status
   * Updates license status (Active, Suspended, Expired, Blocked) & Killswitch
   */
  static async updateLicenseStatus(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const result = await LicenseGeneratorService.updateStatus(body);
      if (result.notFound) {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 });
      }
      if (result.invalidStatus) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    } catch (error: any) {
      return handleApiError(error, "Failed to update license status");
    }
  }

  /**
   * GET /api/license
   * Lists all client licenses with telemetry aggregates
   */
  static async listLicenses(req: NextRequest) {
    try {
      const result = await LicenseGeneratorService.listLicenses();
      return NextResponse.json(result);
    } catch (error: any) {
      return handleApiError(error, "Failed to list licenses");
    }
  }

  /**
   * POST /api/vendor/redeem, /api/license/redeem, /api/license/activate
   * Redeems a license key or voucher code
   */
  static async redeemCode(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const result = await LicenseRedemptionService.redeem(body, clientIp);
      return NextResponse.json(result.payload, { status: result.statusCode });
    } catch (error: any) {
      return handleApiError(error, "Failed to redeem code");
    }
  }

  /**
   * DELETE /api/license
   */
  static async deleteLicense(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json({ success: false, error: "License ID is required" }, { status: 400 });
      }
      const result = await LicenseGeneratorService.deleteLicense(id);
      return NextResponse.json(result);
    } catch (error: any) {
      return handleApiError(error, "Failed to delete license");
    }
  }
}
