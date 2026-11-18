const routes: Array<[string, string[]]> = [
  ['/pos', ['POS']], ['/dashboard/sales', ['POS']], ['/dashboard/treasury', ['POS']],
  ['/dashboard/quotes', ['QUOTES']], ['/dashboard/clients', ['CUSTOMERS']],
  ['/dashboard/credits', ['CREDITS']], ['/dashboard/ecommerce', ['ECOMMERCE']],
  ['/dashboard/transbank', ['TRANSBANK']], ['/dashboard/integrations', ['SHOPIFY', 'WOOCOMMERCE']],
];
export function canAccessModuleRoute(path: string, modules: string[] | undefined, role?: string) {
  if (role === 'SUPER_ADMIN' || modules === undefined) return true;
  const entry = routes.find(([prefix]) => path === prefix || path.startsWith(prefix + '/'));
  return !entry || entry[1].some(code => modules.includes(code));
}
