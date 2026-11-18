import { PrismaService } from '../../prisma/prisma.service';
import { effectiveModuleCodes, moduleTenantInclude } from '../../modules/module-access';
export async function integrationEnabled(prisma: PrismaService, connection: { tenantId: string; platform: string }) {
  const tenant = await prisma.tenant.findUnique({ where: { id: connection.tenantId }, include: moduleTenantInclude });
  return !!tenant && tenant.status === 'ACTIVE' && tenant.billingStatus === 'ACTIVE' && effectiveModuleCodes(tenant).includes(connection.platform);
}
