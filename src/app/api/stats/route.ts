import { NextRequest } from "next/server";
import { StatsController } from "@/controllers/stats.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  return StatsController.getDashboardStats(req);
}
