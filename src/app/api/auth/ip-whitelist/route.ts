import { NextRequest } from "next/server";
import { AuthController } from "@/controllers/auth.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return AuthController.manageIpWhitelist(req);
}

export async function POST(req: NextRequest) {
  return AuthController.manageIpWhitelist(req);
}
