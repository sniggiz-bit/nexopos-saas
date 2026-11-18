export const FEATURE_MODULES: Record<string, string[]> = {
  enableEcommerce: ['ECOMMERCE'], enableTransbank: ['TRANSBANK'],
  enableIntegrations: ['SHOPIFY', 'WOOCOMMERCE'],
  enableBoletaDte: ['DTE_BOLETA'], enableFacturaDte: ['DTE_FACTURA'],
  enableGuiaDespachoDte: ['DTE_GUIA_DESPACHO'], enableNotaCreditoDte: ['DTE_NOTA_CREDITO'],
};
export const moduleTenantInclude = {
  settings: true,
  plan: { include: { planModules: { include: { module: true } } } },
  tenantModuleAddons: { include: { module: true } },
  moduleOverrides: { include: { module: true } },
} as const;

export function effectiveModuleCodes(tenant: any, catalog?: Array<{ code: string; isActive: boolean }>): string[] {
  const active = new Set<string>(tenant.planId ? [] : ['POS', 'QUOTES', 'CUSTOMERS', 'CREDITS']);
  for (const item of [...(tenant.plan?.planModules || []), ...(tenant.tenantModuleAddons || [])]) {
    if (item.module.isActive !== false) active.add(item.module.code);
  }
  for (const [flag, codes] of Object.entries(FEATURE_MODULES)) {
    const enabled = tenant.settings?.[flag] ?? flag === 'enableEcommerce';
    for (const code of codes) if (enabled) active.add(code);
  }
  for (const item of tenant.moduleOverrides || []) {
    if (item.enabled && item.module.isActive !== false) active.add(item.module.code);
    else active.delete(item.module.code);
  }
  for (const mod of catalog || []) if (!mod.isActive) active.delete(mod.code);
  return [...active].sort();
}

export function moduleForRequest(path: string): string | undefined {
  const first = path.replace(/^\/api(?=\/|$)/, '').split('/')[1];
  return ({
    sales: 'POS', shifts: 'POS', treasury: 'POS', receipts: 'POS',
    quotes: 'QUOTES', customers: 'CUSTOMERS', credits: 'CREDITS',
    store: 'ECOMMERCE', transbank: 'TRANSBANK',
  } as Record<string, string>)[first];
}
