import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createIncidentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]).optional(),
  assignedTo: z.string().optional(),
  alertIds: z.array(z.string().uuid()).optional(),
});

const updateIncidentSchema = z.object({
  incidentId: z.string().uuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]).optional(),
  assignedTo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
    const skip = (page - 1) * limit;

    const status = searchParams.get("status") as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | null;

    const where = {
      tenantId: auth.tenantId,
      ...(status && { status }),
    };

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          _count: { select: { alerts: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.incident.count({ where }),
    ]);

    return NextResponse.json({
      incidents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List incidents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();
    const parsed = createIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, priority, assignedTo, alertIds } = parsed.data;

    const incident = await prisma.$transaction(async (tx) => {
      const inc = await tx.incident.create({
        data: {
          tenantId: auth.tenantId,
          title,
          description: description ?? null,
          priority: priority ?? "P3",
          assignedTo: assignedTo ?? null,
        },
      });

      if (alertIds?.length) {
        await tx.alert.updateMany({
          where: { id: { in: alertIds }, tenantId: auth.tenantId },
          data: { status: "INVESTIGATING" },
        });

        await tx.incident.update({
          where: { id: inc.id },
          data: {
            alerts: {
              connect: alertIds.map((id) => ({ id })),
            },
          },
        });
      }

      return inc;
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create incident error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();
    const parsed = updateIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { incidentId, ...updates } = parsed.data;

    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, tenantId: auth.tenantId },
    });
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (updates.status) {
      updateData.status = updates.status;
      if (updates.status === "RESOLVED" || updates.status === "CLOSED") {
        updateData.resolvedAt = new Date();
      }
    }
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: updateData,
    });

    return NextResponse.json({ incident: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update incident error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
