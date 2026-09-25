import { NextRequest } from "next/server";
import { ClientController } from "@/controllers/client.controller";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return ClientController.forceBlock(params.id, req);
}
