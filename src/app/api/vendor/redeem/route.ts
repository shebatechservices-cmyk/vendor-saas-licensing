import { NextRequest } from "next/server";
import { LicenseController } from "@/controllers/license.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  return LicenseController.redeemCode(req);
}
