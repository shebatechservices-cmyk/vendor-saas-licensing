import { NextRequest } from "next/server";
import { ClientController } from "@/controllers/client.controller";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return ClientController.forceBlock(id, req);
}
