import { Prisma } from '@prisma/client';

// Canonical owner for records that do not have their own tenantId.
const via: Record<string, string> = {
  Inventory: 'product', Transfer: 'originBranch', TransferItem: 'transfer',
  SaleItem: 'sale', Payment: 'sale', CashShift: 'branch', QuoteItem: 'quote',
  CreditPayment: 'credit', StockMovement: 'branch', PurchaseItem: 'purchase',
  ProductPriceTier: 'product', ProductMapping: 'connection', RegisteredWebhook: 'connection',
};
const models = new Map(Prisma.dmmf.datamodel.models.map(m => [m.name, m]));
const q = (name: string) => '"' + name.replace(/"/g, '""') + '"';

function ownership(name: string, alias: string, joins: string[], next: { n: number }): string | undefined {
  const model = models.get(name);
  if (!model) return;
  if (name === 'Tenant') return alias + '."id"';
  if (model.fields.some(f => f.name === 'tenantId' && f.kind === 'scalar')) return alias + '."tenantId"';
  const field = model.fields.find(f => f.name === via[name]);
  if (!field?.relationFromFields?.length) return;
  const parent = models.get(field.type)!;
  const parentAlias = 'o' + next.n++;
  joins.push('JOIN ' + q(parent.dbName || parent.name) + ' ' + parentAlias + ' ON ' + alias + '.' + q(field.relationFromFields[0]) + '=' + parentAlias + '.' + q(field.relationToFields![0]));
  return ownership(parent.name, parentAlias, joins, next);
}

// Prevent cascade / SET NULL relationships from modifying a different customer's records.
// SQL identifiers come exclusively from the generated Prisma schema; tenantId is a bound parameter.
export function crossTenantReferenceSql(): string {
  const checks: string[] = [];
  for (const model of models.values()) for (const relation of model.fields) {
    if (!relation.relationFromFields?.length || relation.type === 'Tenant') continue;
    const parent = models.get(relation.type);
    if (!parent) continue;
    const joins: string[] = [];
    const next = { n: 2 };
    const childOwner = ownership(model.name, 'o0', joins, next);
    const parentOwner = ownership(parent.name, 'o1', joins, next);
    if (!childOwner || !parentOwner) continue;
    checks.push('SELECT 1 FROM ' + q(model.dbName || model.name) + ' o0 JOIN ' + q(parent.dbName || parent.name) + ' o1 ON o0.' + q(relation.relationFromFields[0]) + '=o1.' + q(relation.relationToFields![0]) + ' ' + joins.join(' ') +
      ' WHERE ((' + childOwner + '=$1 AND ' + parentOwner + '<>$1) OR (' + childOwner + '<>$1 AND ' + parentOwner + '=$1))');
  }
  return 'SELECT EXISTS (' + checks.join(' UNION ALL ') + ') AS conflict';
}
