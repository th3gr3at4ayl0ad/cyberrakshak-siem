import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { DevicePlatform, Prisma } from "@prisma/client";

const log = logger.child("DeviceService");

export interface RegisterDeviceInput {
  deviceName: string;
  deviceModel?: string;
  platform: DevicePlatform;
  osVersion?: string;
  agentVersion?: string;
  publicKey?: string;
  childId?: string;
}

export async function registerDevice(tenantId: string, input: RegisterDeviceInput) {
  const existing = await prisma.device.findUnique({
    where: { tenantId_deviceName: { tenantId, deviceName: input.deviceName } },
  });

  if (existing) {
    const updated = await prisma.device.update({
      where: { id: existing.id },
      data: {
        deviceModel: input.deviceModel ?? existing.deviceModel,
        platform: input.platform,
        osVersion: input.osVersion ?? existing.osVersion,
        agentVersion: input.agentVersion ?? existing.agentVersion,
        publicKey: input.publicKey ?? existing.publicKey,
        childId: input.childId ?? existing.childId,
        lastSeenAt: new Date(),
        isActive: true,
      },
    });
    log.info(`Device re-registered: ${updated.id}`, { tenantId });
    return updated;
  }

  if (input.childId) {
    const child = await prisma.child.findFirst({
      where: { id: input.childId, tenantId },
    });
    if (!child) {
      throw new Error("CHILD_NOT_FOUND");
    }
  }

  const device = await prisma.device.create({
    data: {
      tenantId,
      deviceName: input.deviceName,
      deviceModel: input.deviceModel ?? null,
      platform: input.platform,
      osVersion: input.osVersion ?? null,
      agentVersion: input.agentVersion ?? null,
      publicKey: input.publicKey ?? null,
      childId: input.childId ?? null,
      lastSeenAt: new Date(),
    },
  });

  log.info(`Device registered: ${device.id}`, { tenantId });
  return device;
}

export async function listDevices(
  tenantId: string,
  params?: { childId?: string; isActive?: boolean; page?: number; limit?: number }
) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Prisma.DeviceWhereInput = {
    tenantId,
    ...(params?.childId && { childId: params.childId }),
    ...(params?.isActive !== undefined && { isActive: params.isActive }),
  };

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      include: {
        child: { select: { id: true, name: true } },
        _count: { select: { events: true, alerts: true } },
      },
      orderBy: { lastSeenAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.device.count({ where }),
  ]);

  return {
    devices,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDevice(tenantId: string, deviceId: string) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, tenantId },
    include: {
      child: { select: { id: true, name: true } },
      _count: { select: { events: true, alerts: true } },
    },
  });

  if (!device) throw new Error("DEVICE_NOT_FOUND");
  return device;
}

export async function deactivateDevice(tenantId: string, deviceId: string) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, tenantId },
  });

  if (!device) throw new Error("DEVICE_NOT_FOUND");

  return prisma.device.update({
    where: { id: deviceId },
    data: { isActive: false },
  });
}
