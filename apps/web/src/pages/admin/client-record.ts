export interface ClientUser {
  id: string; name: string | null; email: string; role: string;
  branchId: string | null; isActive: boolean; createdAt: string;
}
export interface ClientBranch {
  id: string; name: string; address: string | null; isMain: boolean; isActive: boolean;
  _count?: { users: number; sales: number };
}
export interface ClientSettings {
  maxBranches: number; maxUsers: number; maxRegisters: number;
}
export interface ClientRecord {
  id: string; name: string; slug: string; rut: string | null; phone: string | null;
  address: string | null; giro: string | null; createdAt: string; updatedAt: string;
  status: 'ACTIVE' | 'SUSPENDED'; billingStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  nextPayment: string | null; protectedAccount: boolean;
  plan: { id: string; name: string; price: number } | null;
  settings: ClientSettings | null; users: ClientUser[]; branches: ClientBranch[];
  invoices: Array<{ id: string; amount: number; status: string; dueDate: string; paidAt: string | null }>;
  _count: { users: number; branches: number; products: number; sales: number; customers: number; purchases: number };
}
export const fieldClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50';
export const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed';
export const secondaryClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed';
export const cardClass = 'rounded-2xl border border-border bg-card p-5 sm:p-6';
export const roleLabels: Record<string, string> = { TENANT_ADMIN: 'Administrador', MANAGER: 'Encargado', CASHIER: 'Cajero', SUPER_ADMIN: 'Superadmin' };
export function errorMessage(error: any, fallback: string) {
  const value = error.response?.data?.message;
  return Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : fallback;
}
export const money = (value: number) => '$' + Math.round(value).toLocaleString('es-CL');
