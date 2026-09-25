import { NextRequest } from "next/server";
import { CodeController } from "@/controllers/code.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  return CodeController.generateCodes(req);
}
