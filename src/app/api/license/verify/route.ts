import { NextRequest } from "next/server";
import { LicenseController } from "@/controllers/license.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  return LicenseController.verifyLicense(req);
}

export async function GET(req: NextRequest) {
  // Support GET with query parameters
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const secretKey = searchParams.get("secretKey");

  const syntheticReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ clientId, secretKey }),
  });

  return LicenseController.verifyLicense(syntheticReq);
}
