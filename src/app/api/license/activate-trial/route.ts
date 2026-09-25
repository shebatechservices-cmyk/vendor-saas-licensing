import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { deviceId, clientAppId, startDate, endDate, domain, appVersion } = body;
    const clientCode = clientAppId || "CLIENT-SHEBA-TECH-8801";

    let client = await prisma.client.findFirst({
      where: {
        OR: [{ id: clientCode }, { clientCode: clientCode }],
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          clientCode,
          name: domain || "Sheba Technology Trial User",
          secretKey: `sec_trial_${Date.now().toString(36)}`,
          status: "ACTIVE",
          appType: "CCTV/ERP Solution (15-Day Free Trial)",
          domain: domain || "localhost",
          licenseExpiresAt: endDate ? new Date(endDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          lastAppVersion: appVersion || "16.9.26",
          lastStatusReported: "TRIAL_ACTIVE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "15-day free trial registered on vendor SaaS controller.",
      client: {
        id: client.id,
        clientCode: client.clientCode,
        status: client.status,
      },
    });
  } catch (error: any) {
    console.error("Vendor activate-trial error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
