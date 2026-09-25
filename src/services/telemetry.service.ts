import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export interface HeartbeatPayload {
  clientId?: string;
  clientCode?: string;
  appVersion?: string;
  domainReported?: string;
  statusReported?: string;
  activeStudentsCount?: number;
  databaseSizeMb?: number;
  license_key?: string;
  licenseKey?: string;
  mac_address?: string;
  macAddress?: string;
  hardware_fingerprint?: string;
  hardwareFingerprint?: string;
  app_version?: string;
  status?: string;
}

export class TelemetryService {
  /**
   * Determine client online status thresholds
   */
  static getThresholds() {
    const now = new Date();
    return {
      now,
      tenMinutesAgo: new Date(now.getTime() - 10 * 60 * 1000),
      fortyEightHoursAgo: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      threeDaysFromNow: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Record telemetry heartbeat log
   */
  static async recordHeartbeat(clientId: string, data: {
    ipAddress?: string;
    appVersion?: string;
    domainReported?: string;
    statusReported?: string;
    activeStudentsCount?: number;
    databaseSizeMb?: number;
    responseDirectives?: any;
  }) {
    return prisma.heartbeatLog.create({
      data: {
        clientId,
        ipAddress: data.ipAddress || null,
        appVersion: data.appVersion || null,
        domainReported: data.domainReported || null,
        statusReported: data.statusReported || "OPERATIONAL",
        activeStudentsCount: data.activeStudentsCount || null,
        databaseSizeMb: data.databaseSizeMb || null,
        responseDirectives: data.responseDirectives ? JSON.stringify(data.responseDirectives) : null,
      },
    });
  }
}
