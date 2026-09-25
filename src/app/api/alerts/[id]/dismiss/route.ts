import { NextRequest } from "next/server";
import { AlertController } from "@/controllers/alert.controller";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return AlertController.dismissAlert(id);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return AlertController.dismissAlert(id);
}

