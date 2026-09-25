import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/middlewares/error.middleware";

export class LedgerController {
  /**
   * GET /api/ledger
   * Lists transactions and overall financial balances
   */
  static async getLedger(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const clientId = searchParams.get("clientId");
      const transactionType = searchParams.get("type");

      const where: any = {};
      if (clientId && clientId !== "ALL") {
        where.clientId = clientId;
      }
      if (transactionType && transactionType !== "ALL") {
        where.transactionType = transactionType;
      }

      const transactions = await prisma.vendorLedger.findMany({
        where,
        include: {
          client: {
            select: { id: true, clientCode: true, name: true, domain: true },
          },
          referenceCode: {
            select: { id: true, code: true, category: true, studentQuotaAdded: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const totals = await prisma.vendorLedger.aggregate({
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      });

      const totalDebit = totals._sum.debitAmount || 0;
      const totalCredit = totals._sum.creditAmount || 0;
      const totalOutstandingDues = Math.max(0, totalDebit - totalCredit);

      return NextResponse.json({
        success: true,
        transactions,
        summary: {
          totalBilledBdt: totalDebit,
          totalPaidBdt: totalCredit,
          totalOutstandingDuesBdt: totalOutstandingDues,
        },
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to fetch ledger");
    }
  }

  /**
   * POST /api/ledger
   * Records a manual payment (Credit) or billing (Debit)
   */
  static async recordTransaction(req: NextRequest) {
    try {
      const body = await req.json();
      const {
        clientId,
        transactionType = "PAYMENT",
        amountBdt,
        description,
        paymentMethod,
        receiptNumber,
        performedBy = "Vendor Admin",
      } = body;

      if (!clientId || amountBdt === undefined || amountBdt === null) {
        return NextResponse.json(
          { success: false, error: "clientId and amountBdt are required." },
          { status: 400 }
        );
      }

      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found." },
          { status: 404 }
        );
      }

      const parsedAmount = Math.abs(parseFloat(String(amountBdt)));
      let debitAmount = 0;
      let creditAmount = 0;
      let signedAmount = 0;

      if (transactionType === "BILLING") {
        debitAmount = parsedAmount;
        signedAmount = parsedAmount;
      } else if (transactionType === "PAYMENT") {
        creditAmount = parsedAmount;
        signedAmount = -parsedAmount;
      } else if (transactionType === "ADJUSTMENT") {
        signedAmount = parseFloat(String(amountBdt));
        if (signedAmount >= 0) {
          debitAmount = signedAmount;
        } else {
          creditAmount = Math.abs(signedAmount);
        }
      }

      const latestLedger = await prisma.vendorLedger.findFirst({
        where: { clientId },
        orderBy: { createdAt: "desc" },
      });

      const previousBalance = latestLedger ? latestLedger.runningBalanceBdt : 0;
      const newRunningBalance = previousBalance + (debitAmount - creditAmount);

      const transaction = await prisma.vendorLedger.create({
        data: {
          clientId,
          transactionType,
          amountBdt: signedAmount,
          debitAmount,
          creditAmount,
          runningBalanceBdt: newRunningBalance,
          description: description || `${transactionType} transaction recorded`,
          paymentMethod,
          receiptNumber,
          performedBy,
        },
        include: {
          client: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Ledger entry recorded. Updated client balance: ${newRunningBalance.toLocaleString()} BDT.`,
        transaction,
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to record transaction");
    }
  }

  /**
   * GET /api/ledger/[clientId]
   */
  static async getClientStatement(clientId: string) {
    try {
      const client = await prisma.client.findFirst({
        where: {
          OR: [{ id: clientId }, { clientCode: clientId }],
        },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }

      const transactions = await prisma.vendorLedger.findMany({
        where: { clientId: client.id },
        include: {
          referenceCode: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const totals = await prisma.vendorLedger.aggregate({
        where: { clientId: client.id },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      });

      const totalDebit = totals._sum.debitAmount || 0;
      const totalCredit = totals._sum.creditAmount || 0;
      const currentDue = Math.max(0, totalDebit - totalCredit);

      return NextResponse.json({
        success: true,
        client: {
          id: client.id,
          clientCode: client.clientCode,
          name: client.name,
          domain: client.domain,
          status: client.status,
        },
        transactions,
        statementSummary: {
          totalBilledBdt: totalDebit,
          totalPaidBdt: totalCredit,
          currentDueBdt: currentDue,
        },
      });
    } catch (error: any) {
      return handleApiError(error, "Failed to fetch statement");
    }
  }
}
