import { NextRequest, NextResponse } from "next/server";

/**
 * Extract client IP address reliably from request headers or socket
 */
export function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Return first IP if comma-separated proxy chain
    const clientIp = forwarded.split(",")[0].trim();
    if (clientIp) return normalizeIp(clientIp);
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return normalizeIp(realIp.trim());

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return normalizeIp(cfIp.trim());

  const socketIp = (req as any).ip || "127.0.0.1";
  return normalizeIp(socketIp);
}

/**
 * Normalize loopback and IPv4-mapped IPv6 addresses
 */
export function normalizeIp(ip: string): string {
  let cleaned = ip.trim();
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.substring(7);
  }
  if (cleaned === "::1" || cleaned === "localhost" || cleaned === "0:0:0:0:0:0:0:1") {
    return "127.0.0.1";
  }
  return cleaned;
}

/**
 * Check if given client IP is authorized against allowed list
 */
export function isIpAuthorized(clientIp: string, allowedIpsString?: string | null): boolean {
  const normalizedClient = normalizeIp(clientIp);

  // If no restrictions configured, allow
  if (!allowedIpsString || allowedIpsString.trim() === "" || allowedIpsString === "*") {
    return true;
  }

  // Parse comma-separated or space-separated allowed IPs
  const allowedList = allowedIpsString
    .split(/[\s,]+/)
    .map((item) => normalizeIp(item.trim()))
    .filter(Boolean);

  for (const allowed of allowedList) {
    if (allowed === "*" || allowed === "all") return true;
    if (allowed === normalizedClient) return true;

    // Simple wildcard match e.g. 192.168.1.*
    if (allowed.endsWith(".*")) {
      const prefix = allowed.slice(0, -2);
      if (normalizedClient.startsWith(prefix)) return true;
    }
  }

  return false;
}

/**
 * 3rd Verification Layer Middleware: Enforces IP Whitelisting for Admin Portal
 */
export function verifyIpWhitelist(req: NextRequest, allowedIpsString?: string | null): {
  authorized: boolean;
  clientIp: string;
  response?: NextResponse;
} {
  const clientIp = extractClientIp(req);
  const authorized = isIpAuthorized(clientIp, allowedIpsString);

  if (!authorized) {
    return {
      authorized: false,
      clientIp,
      response: NextResponse.json(
        {
          success: false,
          error: "Network Access Denied",
          message: `IP address [${clientIp}] is not authorized to access the Vendor administration portal (3FA Layer).`,
          clientIp,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, clientIp };
}
