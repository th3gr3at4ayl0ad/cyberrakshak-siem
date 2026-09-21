import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAlertStats } from "@/services/alert.service";

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth();
    const tenantId = auth.tenantId;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalDevices,
      activeDevices,
      totalEvents,
      eventsLast24h,
      eventsLast7d,
      openIncidents,
      alertStats,
      recentAlerts,
      eventsByType,
      eventsBySeverity,
    ] = await Promise.all([
      prisma.device.count({ where: { tenantId } }),
      prisma.device.count({ where: { tenantId, isActive: true } }),
      prisma.event.count({ where: { tenantId } }),
      prisma.event.count({ where: { tenantId, ingestedAt: { gte: last24h } } }),
      prisma.event.count({ where: { tenantId, ingestedAt: { gte: last7d } } }),
      prisma.incident.count({ where: { tenantId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      getAlertStats(tenantId),
      prisma.alert.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          device: { select: { id: true, deviceName: true } },
        },
      }),
      prisma.event.groupBy({
        by: ["eventType"],
        where: { tenantId, ingestedAt: { gte: last24h } },
        _count: true,
        orderBy: { _count: { eventType: "desc" } },
        take: 10,
      }),
      prisma.event.groupBy({
        by: ["severity"],
        where: { tenantId, ingestedAt: { gte: last24h } },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      devices: { total: totalDevices, active: activeDevices },
      events: {
        total: totalEvents,
        last24h: eventsLast24h,
        last7d: eventsLast7d,
        byType: Object.fromEntries(eventsByType.map((e) => [e.eventType, e._count])),
        bySeverity: Object.fromEntries(eventsBySeverity.map((e) => [e.severity, e._count])),
      },
      incidents: { open: openIncidents },
      alerts: alertStats,
      recentAlerts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Dashboard summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
