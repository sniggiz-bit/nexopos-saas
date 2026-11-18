import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '@/lib/api';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
}

interface StoredMessage { id: string; sender: string; content: string }
const initialMessage: Message = { id: 'initial', sender: 'bot', text: '¡Hola! Escríbenos tu consulta. Nuestro equipo podrá responderte por este mismo chat.' };
const mapMessage = (message: StoredMessage): Message => ({ id: message.id, sender: message.sender === 'VISITOR' ? 'user' : message.sender === 'ADMIN' ? 'admin' : 'bot', text: message.content });

export function SupportChatWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const revision = useRef(0);
  const epoch = useRef(0);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    epoch.current++;
    revision.current++;
    sending.current = false;
    setMessages([initialMessage]);
    setInput('');
    setError('');
    setLoading(false);
    return () => { epoch.current++; revision.current++; };
  }, [user?.id, token]);

  const refresh = useCallback(async () => {
    if (sending.current || !user?.id || !token) return;
    const request = ++revision.current;
    try {
      const response = await api.get<{ messages: StoredMessage[] }>('/support/chat');
      if (request !== revision.current) return;
      setMessages(response.data.messages.length ? response.data.messages.map(mapMessage) : [initialMessage]);
      setError(prev => prev.startsWith('No se pudo confirmar el envío') ? prev : '');
    } catch {
      if (request === revision.current) setError('No se pudo actualizar el historial. Volveremos a intentarlo.');
    }
  }, [user?.id, token]);

  useEffect(() => {
    if (!isOpen) return;
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 5000);
    return () => { window.clearInterval(interval); revision.current++; };
  }, [isOpen, refresh]);

  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (isOpen) endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || sending.current) return;
    const currentEpoch = epoch.current;
    sending.current = true;
    revision.current++;
    setLoading(true);
    setError('');
    try {
      const response = await api.post<{ messages: StoredMessage[] }>('/support/chat', { message: input.trim() });
      if (currentEpoch !== epoch.current) return;
      const saved = response.data.messages.map(mapMessage);
      setMessages(prev => [...prev.filter(m => m.id !== 'initial' && !saved.some(n => n.id === m.id)), ...saved]);
      setInput('');
    } catch {
      if (currentEpoch === epoch.current) setError('No se pudo confirmar el envío. Conservamos tu texto; revisa el historial antes de reintentar.');
    } finally {
      if (currentEpoch === epoch.current) {
        sending.current = false;
        setLoading(false);
        void refresh();
      }
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        aria-label="Abrir chat de soporte"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 hover:scale-110 transition-all z-50 ${isOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Ventana de Chat */}
      <div className={`fixed bottom-6 right-6 w-[calc(100vw-3rem)] max-w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: 'min(500px, calc(100dvh - 3rem))' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-800 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Soporte NexoPOS</h3>
              <p className="text-[10px] text-green-400 font-medium">Mensajes con nuestro equipo</p>
            </div>
          </div>
          <button aria-label="Cerrar chat de soporte" onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-neutral-800 border border-neutral-700'}`}>
                  {msg.sender !== 'bot' ? <User className="w-4 h-4 text-foreground" /> : <Bot className="w-4 h-4 text-purple-400" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm break-words [overflow-wrap:anywhere] ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-sm'}`}>
                  {msg.sender === 'admin' && <p className="text-[10px] font-bold text-emerald-300 mb-1">Equipo de soporte</p>}{msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-800 border border-neutral-700">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="p-3 rounded-2xl bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-2 rounded-tl-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800">
          {error && <p role="alert" className="text-xs text-amber-300 mb-2">{error}</p>}
          <form onSubmit={e => { e.preventDefault(); void handleSend(); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              aria-label="Mensaje para soporte"
              maxLength={4000}
              disabled={loading}
              placeholder="Escribe tu consulta..."
              className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              aria-label="Enviar mensaje a soporte"
              disabled={!input.trim() || loading}
              className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
