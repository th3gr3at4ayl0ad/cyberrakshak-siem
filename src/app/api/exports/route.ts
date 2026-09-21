import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createExportSchema = z.object({
  format: z.enum(["CSV", "JSON", "PDF"]),
  filters: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      eventTypes: z.array(z.string()).optional(),
      severities: z.array(z.string()).optional(),
      deviceIds: z.array(z.string().uuid()).optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.exportJob.findMany({
        where: { tenantId: auth.tenantId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.exportJob.count({ where: { tenantId: auth.tenantId } }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List exports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();
    const parsed = createExportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const exportJob = await prisma.exportJob.create({
      data: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        format: parsed.data.format,
        filters: parsed.data.filters ?? {},
      },
    });

    return NextResponse.json({ exportJob }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
