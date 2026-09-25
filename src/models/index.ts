import { prisma } from "@/lib/prisma";
import {
  Client as PrismaClientModel,
  LicenseCode as PrismaLicenseCodeModel,
  AppQuota as PrismaAppQuotaModel,
  VendorLedger as PrismaVendorLedgerModel,
  HeartbeatLog as PrismaHeartbeatLogModel,
  BatchGeneration as PrismaBatchGenerationModel,
} from "@prisma/client";

export { prisma };

export type Client = PrismaClientModel;
export type LicenseCode = PrismaLicenseCodeModel;
export type AppQuota = PrismaAppQuotaModel;
export type VendorLedger = PrismaVendorLedgerModel;
export type HeartbeatLog = PrismaHeartbeatLogModel;
export type BatchGeneration = PrismaBatchGenerationModel;

export type ClientStatusType = "ACTIVE" | "BLOCKED" | "SUSPENDED" | "EXPIRED" | "PENDING";

export type CodeCategoryType =
  | "APP_LICENSE"
  | "HOSTING_RENEWAL"
  | "DOMAIN_RENEWAL"
  | "STUDENT_QUOTA_UPGRADE";

export type ValidityTypeEnum =
  | "YEARS_1"
  | "YEARS_2"
  | "YEARS_3"
  | "YEARS_4"
  | "YEARS_5"
  | "YEARS_6"
  | "YEARS_7"
  | "YEARS_8"
  | "YEARS_9"
  | "YEARS_10"
  | "YEARS_11"
  | "YEARS_12"
  | "LIFETIME"
  | "QUOTA_CREDITS";

export type CodeStatusType = "AVAILABLE" | "ASSIGNED" | "USED" | "REVOKED" | "EXPIRED";

export type TransactionTypeEnum = "BILLING" | "REDEMPTION" | "PAYMENT" | "ADJUSTMENT";
