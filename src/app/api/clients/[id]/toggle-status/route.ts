import { NextRequest } from "next/server";
import { ClientController } from "@/controllers/client.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ClientController.toggleClientStatus(id, req);
}
