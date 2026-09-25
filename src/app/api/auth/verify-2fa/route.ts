import { NextRequest } from "next/server";
import { AuthController } from "@/controllers/auth.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return AuthController.verify2FA(req);
}
