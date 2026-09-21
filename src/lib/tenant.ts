import { prisma } from "./prisma";
import type { JwtPayload } from "./auth";

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export async function getTenantContext(auth: JwtPayload): Promise<TenantContext> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: { id: true, name: true },
  });

  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  return {
    tenantId: tenant.id,
    userId: auth.userId,
    role: auth.role,
  };
}

export function tenantWhere(baseWhere: Record<string, unknown> = {}) {
  return (tenantId: string) => ({
    ...baseWhere,
    tenantId,
  });
}

export const eventTenantWhere = tenantWhere();
export const deviceTenantWhere = tenantWhere();
export const alertTenantWhere = tenantWhere();
export const incidentTenantWhere = tenantWhere();
export const policyTenantWhere = tenantWhere();
