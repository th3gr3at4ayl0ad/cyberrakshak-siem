import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Severity, AlertStatus, Prisma } from "@prisma/client";

const log = logger.child("AlertService");

export interface CreateAlertInput {
  deviceId: string;
  eventId?: string;
  title: string;
  description?: string;
  severity: Severity;
  ruleId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAlert(tenantId: string, input: CreateAlertInput) {
  const device = await prisma.device.findFirst({
    where: { id: input.deviceId, tenantId, isActive: true },
  });
  if (!device) throw new Error("DEVICE_NOT_FOUND");

  if (input.eventId) {
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, tenantId },
    });
    if (!event) throw new Error("EVENT_NOT_FOUND");
  }

  const alert = await prisma.alert.create({
    data: {
      tenantId,
      deviceId: input.deviceId,
      eventId: input.eventId ?? null,
      title: input.title,
      description: input.description ?? null,
      severity: input.severity,
      ruleId: input.ruleId ?? null,
      metadata: input.metadata ?? {},
    },
    include: {
      device: { select: { id: true, deviceName: true, platform: true } },
    },
  });

  log.info(`Alert created: ${alert.id} [${alert.severity}]`, { tenantId });

  if (alert.severity === "CRITICAL") {
    log.warn(`CRITICAL alert triggered: ${alert.title}`, {
      tenantId,
      alertId: alert.id,
      deviceId: input.deviceId,
    });
  }

  return alert;
}

export async function listAlerts(
  tenantId: string,
  params?: {
    deviceId?: string;
    severity?: Severity;
    status?: AlertStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Prisma.AlertWhereInput = {
    tenantId,
    ...(params?.deviceId && { deviceId: params.deviceId }),
    ...(params?.severity && { severity: params.severity }),
    ...(params?.status && { status: params.status }),
    ...(params?.from || params?.to
      ? {
          createdAt: {
            ...(params?.from && { gte: new Date(params.from) }),
            ...(params?.to && { lte: new Date(params.to) }),
          },
        }
      : {}),
  };

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: {
        device: { select: { id: true, deviceName: true, platform: true } },
        _count: { select: { incidents: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.alert.count({ where }),
  ]);

  return {
    alerts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateAlertStatus(
  tenantId: string,
  alertId: string,
  status: AlertStatus
) {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, tenantId },
  });
  if (!alert) throw new Error("ALERT_NOT_FOUND");

  const updateData: Prisma.AlertUpdateInput = { status };

  if (status === "RESOLVED") {
    updateData.resolvedAt = new Date();
  } else if (status === "INVESTIGATING") {
    updateData.acknowledgedAt = new Date();
  }

  return prisma.alert.update({
    where: { id: alertId },
    data: updateData,
  });
}

export async function getAlertStats(tenantId: string) {
  const [total, bySeverity, byStatus] = await Promise.all([
    prisma.alert.count({ where: { tenantId } }),
    prisma.alert.groupBy({
      by: ["severity"],
      where: { tenantId },
      _count: true,
    }),
    prisma.alert.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
  ]);

  const last24h = await prisma.alert.count({
    where: {
      tenantId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  return {
    total,
    last24h,
    bySeverity: Object.fromEntries(
      bySeverity.map((s) => [s.severity, s._count])
    ),
    byStatus: Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    ),
  };
}
