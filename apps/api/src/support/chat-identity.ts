import { createHash } from 'node:crypto';

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function accountVisitorId(tenantId: string, userId: string): string {
  return `account:${tenantId}:${userId}`;
}

// UUID v8 determinista: una conversación por usuario y empresa, sin duplicados entre pestañas.
export function accountChatSessionId(tenantId: string, userId: string): string {
  const h = createHash('sha256')
    .update(accountVisitorId(tenantId, userId))
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function accountChatRoom(tenantId: string, userId: string): string {
  return `support_${tenantId}_${userId}`;
}

export function replyRoom(visitorId: string): string {
  if (visitorId.startsWith('account:')) {
    const [, tenantId, userId] = visitorId.split(':');
    if (!tenantId || !userId || visitorId.split(':').length !== 3)
      throw new Error('Invalid account chat identity');
    return accountChatRoom(tenantId, userId);
  }
  if (!UUID_PATTERN.test(visitorId))
    throw new Error('Invalid public chat identity');
  return `visitor_${visitorId}`;
}
