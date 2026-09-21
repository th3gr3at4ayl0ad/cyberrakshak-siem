import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listEvents } from "@/services/eventIngest.service";
import type { EventType, Severity } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);

    const result = await listEvents(auth.tenantId, {
      deviceId: searchParams.get("deviceId") ?? undefined,
      eventType: (searchParams.get("eventType") as EventType) ?? undefined,
      severity: (searchParams.get("severity") as Severity) ?? undefined,
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
    console.error("List events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
