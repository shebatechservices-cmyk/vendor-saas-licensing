import { NextRequest } from "next/server";
import { ClientController } from "@/controllers/client.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  return ClientController.getAllClients(req);
}

export async function POST(req: NextRequest) {
  return ClientController.createClient(req);
}
