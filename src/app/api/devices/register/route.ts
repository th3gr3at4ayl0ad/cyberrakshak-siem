import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { registerDevice } from "@/services/device.service";
import { z } from "zod";

const registerDeviceSchema = z.object({
  deviceName: z.string().min(1, "Device name is required"),
  deviceModel: z.string().optional(),
  platform: z.enum(["ANDROID", "IOS", "WINDOWS", "LINUX", "MACOS"]),
  osVersion: z.string().optional(),
  agentVersion: z.string().optional(),
  publicKey: z.string().optional(),
  childId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();
    const parsed = registerDeviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const device = await registerDevice(auth.tenantId, parsed.data);

    return NextResponse.json({ device }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "CHILD_NOT_FOUND") {
      return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
    }
    console.error("Device registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
