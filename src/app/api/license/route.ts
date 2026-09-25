import { NextRequest } from "next/server";
import { LicenseController } from "@/controllers/license.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return LicenseController.listLicenses(req);
}

export async function POST(req: NextRequest) {
  return LicenseController.generateLicense(req);
}

export async function DELETE(req: NextRequest) {
  return LicenseController.deleteLicense(req);
}
