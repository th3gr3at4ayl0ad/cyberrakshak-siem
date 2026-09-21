import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { EventType, Severity, Prisma } from "@prisma/client";

const log = logger.child("EventIngestService");

export interface IngestEventInput {
  deviceId: string;
  eventId: string;
  eventType: EventType;
  severity?: Severity;
  source?: string;
  destination?: string;
  payload?: Record<string, unknown>;
  rawLog?: string;
  timestamp?: string;
}

export interface IngestResult {
  accepted: number;
  rejected: number;
  duplicates: number;
  errors: string[];
}

export async function bulkIngestEvents(
  tenantId: string,
  events: IngestEventInput[]
): Promise<IngestResult> {
  const result: IngestResult = {
    accepted: 0,
    rejected: 0,
    duplicates: 0,
    errors: [],
  };

  if (!events.length) return result;

  const deviceIds = [...new Set(events.map((e) => e.deviceId))];
  const validDevices = await prisma.device.findMany({
    where: {
      tenantId,
      id: { in: deviceIds },
      isActive: true,
    },
    select: { id: true },
  });

  const validDeviceIds = new Set(validDevices.map((d) => d.id));

  const validEvents = events.filter((event) => {
    if (!validDeviceIds.has(event.deviceId)) {
      result.rejected++;
      result.errors.push(`Device ${event.deviceId} not found or inactive`);
      return false;
    }
    return true;
  });

  const existingEvents = await prisma.event.findMany({
    where: {
      tenantId,
      OR: validEvents.map((e) => ({
        AND: { deviceId: e.deviceId, eventId: e.eventId },
      })),
    },
    select: { deviceId: true, eventId: true },
  });

  const existingSet = new Set(
    existingEvents.map((e) => `${e.deviceId}:${e.eventId}`)
  );

  const newEvents: Prisma.EventCreateManyInput[] = [];
  for (const event of validEvents) {
    const compositeKey = `${event.deviceId}:${event.eventId}`;
    if (existingSet.has(compositeKey)) {
      result.duplicates++;
      continue;
    }
    existingSet.add(compositeKey);

    newEvents.push({
      tenantId,
      deviceId: event.deviceId,
      eventId: event.eventId,
      eventType: event.eventType,
      severity: event.severity ?? "LOW",
      source: event.source ?? null,
      destination: event.destination ?? null,
      payload: event.payload ?? {},
      rawLog: event.rawLog ?? null,
      ingestedAt: event.timestamp ? new Date(event.timestamp) : new Date(),
    });
  }

  if (newEvents.length > 0) {
    try {
      const chunks = chunkArray(newEvents, 500);
      for (const chunk of chunks) {
        await prisma.event.createMany({ data: chunk, skipDuplicates: true });
        result.accepted += chunk.length;
      }
      log.info(`Bulk ingested ${result.accepted} events for tenant ${tenantId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log.error(`Bulk ingest failed: ${message}`, { tenantId });
      result.errors.push(`Ingest failed: ${message}`);
    }
  }

  return result;
}

export async function listEvents(
  tenantId: string,
  params: {
    deviceId?: string;
    eventType?: EventType;
    severity?: Severity;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Prisma.EventWhereInput = {
    tenantId,
    ...(params.deviceId && { deviceId: params.deviceId }),
    ...(params.eventType && { eventType: params.eventType }),
    ...(params.severity && { severity: params.severity }),
    ...(params.from || params.to
      ? {
          ingestedAt: {
            ...(params.from && { gte: new Date(params.from) }),
            ...(params.to && { lte: new Date(params.to) }),
          },
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { device: { select: { id: true, deviceName: true, platform: true } } },
      orderBy: { ingestedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
