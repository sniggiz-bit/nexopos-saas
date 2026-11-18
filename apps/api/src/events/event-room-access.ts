import { accountChatRoom, UUID_PATTERN } from '../support/chat-identity';

type SocketUser = { tenantId?: string; sub?: string; role?: string };

export function canJoinEventsRoom(room: string, user: SocketUser | null): boolean {
  if (room === 'superadmin') return user?.role === 'SUPER_ADMIN';
  if (room.startsWith('support_')) return Boolean(user?.tenantId && user.sub && room === accountChatRoom(user.tenantId, user.sub));
  if (!user) return room === 'public' || (room.startsWith('visitor_') && UUID_PATTERN.test(room.slice(8)));
  return room === user.tenantId || user.role === 'SUPER_ADMIN';
}
