import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { bulkIngestEvents, type IngestEventInput } from "@/services/eventIngest.service";
import { z } from "zod";

const eventSchema = z.object({
  deviceId: z.string().uuid(),
  eventId: z.string().min(1),
  eventType: z.enum([
    "LOGIN", "LOGOUT", "FILE_ACCESS", "NETWORK_CONNECTION",
    "APP_INSTALL", "APP_UNINSTALL", "SCREENSHOT", "KEYSTROKE",
    "SMS", "CALL", "BROWSER_HISTORY", "LOCATION", "CAMERA",
    "MICROPHONE", "USB_CONNECTION", "BLUETOOTH", "WIFI_CHANGE",
    "SYSTEM_ALERT", "FIREWALL", "MALWARE_DETECTION",
    "DATA_EXFILTRATION", "PRIVILEGE_ESCALATION", "CUSTOM",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
  rawLog: z.string().optional(),
  timestamp: z.string().optional(),
});

const bulkIngestSchema = z.object({
  events: z.array(eventSchema).min(1, "At least one event is required").max(1000, "Maximum 1000 events per batch"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();
    const parsed = bulkIngestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await bulkIngestEvents(auth.tenantId, parsed.data.events as IngestEventInput[]);

    return NextResponse.json(result, {
      status: result.rejected > 0 && result.accepted === 0 ? 422 : 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Bulk ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
