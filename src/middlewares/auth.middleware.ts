import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Client } from "@/models";

export interface AuthResult {
  isAuthenticated: boolean;
  client?: Client;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticates client application requests using clientId/clientCode and secretKey
 */
export async function authenticateClient(
  clientIdOrCode?: string | null,
  secretKey?: string | null
): Promise<AuthResult> {
  if (!clientIdOrCode || !secretKey) {
    return {
      isAuthenticated: false,
      error: "Missing client credentials: 'clientId' and 'secretKey' are required.",
      statusCode: 401,
    };
  }

  const client = await prisma.client.findFirst({
    where: {
      OR: [{ id: clientIdOrCode }, { clientCode: clientIdOrCode }],
      secretKey: secretKey,
    },
    include: {
      quotas: true,
    },
  });

  if (!client) {
    return {
      isAuthenticated: false,
      error: "Invalid client credentials. Authentication rejected.",
      statusCode: 401,
    };
  }

  return {
    isAuthenticated: true,
    client,
  };
}

/**
 * Authenticates Vendor Admin requests via Header 'x-admin-key' or Authorization Bearer token
 */
export function authenticateAdmin(req: NextRequest): boolean {
  const adminKey = req.headers.get("x-admin-key");
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.ADMIN_API_KEY || "vendor_admin_key_super_secure_2026";

  if (adminKey && adminKey === expectedKey) {
    return true;
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token === expectedKey) return true;
  }

  return false;
}
