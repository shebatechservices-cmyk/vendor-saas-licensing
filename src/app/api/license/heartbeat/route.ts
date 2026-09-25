import { NextRequest } from "next/server";
import { LicenseController } from "@/controllers/license.controller";

export async function POST(req: NextRequest) {
  return LicenseController.heartbeat(req);
}
