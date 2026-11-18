import { PrismaService } from '../prisma/prisma.service';

// Local diagnostics never query Lioren or modify an emission attempt.
export async function getLocalDteRecords(prisma: PrismaService, tenantId: string) {
  const [confirmed, unverified, errors, pending, reviewDocs, needsSupport] = await Promise.all([
    prisma.sale.count({ where: { tenantId, dteVerifiedAt: { not: null }, dteFolio: { not: null } } }),
    prisma.sale.count({ where: { tenantId, dteVerifiedAt: null, OR: [{ dteFolio: { not: null } }, { dtePdfUrl: { contains: 'ejemplo-mock' } }] } }),
    prisma.sale.count({ where: { tenantId, dteStatus: { in: ['ERROR', 'RECHAZADO', 'REQUIERE_REVISION', 'BLOQUEADO'] } } }),
    prisma.sale.count({ where: { tenantId, dteStatus: { in: ['ENVIANDO', 'PENDIENTE_CONFIRMACION', 'EMITIDO', 'PENDIENTE_SII', 'REPARO'] } } }),
    prisma.sale.findMany({ where: { tenantId, dteProviderId: { not: null }, dteFolio: { not: null }, dteSubmission: { isNot: null }, dteStatus: { in: ['EMITIDO', 'PENDIENTE_SII', 'REPARO'] } }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, dteType: true, dteFolio: true, dteStatus: true } }),
    prisma.sale.count({ where: { tenantId, dteSubmission: { isNot: null }, dteStatus: { in: ['ERROR', 'RECHAZADO', 'REQUIERE_REVISION', 'PENDIENTE_CONFIRMACION'] } } }),
  ]);
  return { confirmed, unverified, errors, pending, reviewDocs, needsSupport };
}
