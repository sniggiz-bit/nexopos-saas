import { SupportConversationWidget } from '../support/SupportConversationWidget';
export function PublicChatWidget({ cfg: _cfg }: { cfg: { welcomeMessage: string; options: string[] } }) {
  return <SupportConversationWidget audience="PUBLIC" identity="public" />;
}
