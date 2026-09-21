import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAlert, listAlerts, updateAlertStatus } from "@/services/alert.service";
import { z } from "zod";

const createAlertSchema = z.object({
  deviceId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  ruleId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateStatusSchema = z.object({
  alertId: z.string().uuid(),
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE", "ESCALATED"]),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);

    const result = await listAlerts(auth.tenantId, {
      deviceId: searchParams.get("deviceId") ?? undefined,
      severity: (searchParams.get("severity") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? undefined,
      status: (searchParams.get("status") as "OPEN" | "INVESTIGATING" | "RESOLVED" | "FALSE_POSITIVE" | "ESCALATED") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();
    const parsed = createAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const alert = await createAlert(auth.tenantId, parsed.data);
    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "DEVICE_NOT_FOUND") {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }
    console.error("Create alert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const alert = await updateAlertStatus(
      auth.tenantId,
      parsed.data.alertId,
      parsed.data.status
    );

    return NextResponse.json({ alert });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "ALERT_NOT_FOUND") {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    console.error("Update alert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
