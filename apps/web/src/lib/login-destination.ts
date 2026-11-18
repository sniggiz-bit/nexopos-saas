interface RequestedLocation { pathname?: string; search?: string; hash?: string }

export function loginDestination(role: string, requested?: RequestedLocation): string {
  const fallback = role === 'SUPER_ADMIN' ? '/admin/dashboard' : role === 'CASHIER' ? '/pos' : role === 'TENANT_ADMIN' || role === 'MANAGER' ? '/dashboard' : '/';
  if (!requested || typeof requested.pathname !== 'string') return fallback;
  const raw = requested.pathname;
  if (!raw.startsWith('/') || raw.startsWith('//') || /[\\\r\n]/.test(raw)) return fallback;
  const pathname = new URL(raw, 'https://nexopos.invalid').pathname;
  const base = role === 'SUPER_ADMIN' ? '/admin' : role === 'CASHIER' ? '/pos' : role === 'TENANT_ADMIN' || role === 'MANAGER' ? '/dashboard' : null;
  if (!base || (pathname !== base && !pathname.startsWith(base + '/'))) return fallback;
  const search = typeof requested.search === 'string' && requested.search.startsWith('?') ? requested.search : '';
  const hash = typeof requested.hash === 'string' && requested.hash.startsWith('#') ? requested.hash : '';
  return pathname + search + hash;
}
