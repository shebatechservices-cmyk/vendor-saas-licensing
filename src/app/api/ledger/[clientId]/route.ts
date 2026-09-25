import { NextRequest } from "next/server";
import { LedgerController } from "@/controllers/ledger.controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  return LedgerController.getClientStatement(params.clientId);
}
