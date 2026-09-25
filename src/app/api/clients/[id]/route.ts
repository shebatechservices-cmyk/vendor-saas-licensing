import { NextRequest } from "next/server";
import { ClientController } from "@/controllers/client.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return ClientController.getClientById(params.id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return ClientController.updateClient(params.id, req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return ClientController.deleteClient(params.id);
}
