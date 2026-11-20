import { useAuth } from '../../context/AuthContext';
import { SupportConversationWidget } from '../support/SupportConversationWidget';
export function SupportChatWidget() {
  const { user, token } = useAuth();
  return user && token ? <SupportConversationWidget audience="ACCOUNT" identity={user.id + ':' + token} socketAuth={{ token, tenantId: 'support_' + user.tenantId + '_' + user.id }} /> : null;
}
