import { NextRequest } from "next/server";
import { AlertController } from "@/controllers/alert.controller";

export async function GET(req: NextRequest) {
  return AlertController.getAlerts(req);
}

export async function POST(req: NextRequest) {
  return AlertController.createAlert(req);
}
