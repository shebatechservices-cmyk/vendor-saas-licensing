import { NextRequest } from "next/server";
import { AlertController } from "@/controllers/alert.controller";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return AlertController.dismissAlert(params.id);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return AlertController.dismissAlert(params.id);
}
