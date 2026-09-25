import { Client, LicenseCode, AppQuota, VendorLedger, HeartbeatLog, BatchGeneration } from "@prisma/client";

export interface HeartbeatPayload {
  clientId: string;
  secretKey: string;
  appVersion?: string;
  domain?: string;
  statusReported?: string;
  activeStudentsCount?: number;
  databaseSizeMb?: number;
  metadata?: Record<string, unknown>;
}

export interface HeartbeatResponse {
  success: boolean;
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "PENDING";
  killswitch: boolean;
  message: string;
  client: {
    name: string;
    clientCode: string;
    isLifetime: boolean;
    licenseExpiresAt: string | null;
    hostingExpiresAt: string | null;
    domainExpiresAt: string | null;
    studentQuota: number;
    storageQuotaGb: number;
  };
  serverTime: string;
}

export interface RedeemPayload {
  clientId: string;
  secretKey: string;
  code: string;
}

export interface RedeemResponse {
  success: boolean;
  message: string;
  codeDetails: {
    code: string;
    category: string;
    appliedBenefit: string;
    priceBdt: number;
  };
  updatedClient: {
    clientCode: string;
    name: string;
    status: string;
    isLifetime: boolean;
    licenseExpiresAt: string | null;
    hostingExpiresAt: string | null;
    domainExpiresAt: string | null;
    studentQuota: number;
    totalCredits: number;
  };
  ledgerEntryId?: string;
  serverTime: string;
}

export type ClientWithRelations = Client & {
  quotas: AppQuota | null;
  ledgerEntries: VendorLedger[];
  redeemedCodes: LicenseCode[];
  heartbeats: HeartbeatLog[];
};
