import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  options?: string[];
}

export function PublicChatWidget({ cfg }: { cfg: { welcomeMessage: string; options: string[] } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'initial', 
      sender: 'bot', 
      text: cfg.welcomeMessage || '¡Hola! Soy tu asistente inteligente NexoPOS. ¿En qué te puedo ayudar hoy?',
      options: cfg.options?.length ? cfg.options : undefined
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [visitorId, setVisitorId] = useState<string>(() => {
    const saved = localStorage.getItem('nexopos_visitor_id');
    return saved || ''; // Will be populated by first API call if empty
  });
  const [_socket, setSocket] = useState<Socket | null>(null);

  // Setup WebSocket connection to listen for admin replies
  useEffect(() => {
    if (!visitorId) return;

    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000/events', {
      auth: { token: 'anonymous', tenantId: `visitor_${visitorId}` },
      transports: ['websocket']
    });

    newSocket.on('admin_reply', (payload) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot', // We can show admin replies as bot or add 'admin' type
        text: payload.message
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [visitorId]);

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // POST to the new public endpoint
      const res = await apiClient.post('/support/public-chat', { 
        message: text,
        visitorId: visitorId || undefined
      });
      
      if (res.data.visitorId && !visitorId) {
        setVisitorId(res.data.visitorId);
        localStorage.setItem('nexopos_visitor_id', res.data.visitorId);
      }

      const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: res.data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (_error) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: 'Disculpa, tuve un error al procesar tu solicitud.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 hover:scale-110 transition-all z-50 ${isOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Ventana de Chat */}
      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-slate-900 border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/80 backdrop-blur-md border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Soporte IA</h3>
              <p className="text-[10px] text-emerald-400 font-medium">En línea</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-slate-800 border border-white/[0.1]'}`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4 text-foreground" /> : <Bot className="w-4 h-4 text-purple-400" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-white/[0.05] rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
              
              {/* Opciones rápidas (Botones) */}
              {msg.options && msg.options.length > 0 && (
                <div className="ml-10 mt-2 flex flex-wrap gap-2">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(opt)}
                      disabled={loading}
                      className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-white/[0.1]">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 border border-white/[0.05] flex items-center gap-2 rounded-tl-sm text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Escribiendo...
                </div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900 border-t border-white/[0.05]">
          <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-purple-600/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
