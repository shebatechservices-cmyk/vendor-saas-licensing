import { NextRequest } from "next/server";
import { AuthController } from "@/controllers/auth.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return AuthController.getMe(req);
}
