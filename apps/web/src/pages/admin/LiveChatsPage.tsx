import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, Clock, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function LiveChatsPage() {
  const { user: _user, token } = useAuth();
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [_socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['active-chats'],
    queryFn: async () => {
      const { data } = await api.post('/support/active-sessions');
      return data;
    },
    refetchInterval: 10000, // Poll every 10s as backup
  });

  // Setup WebSocket connection to listen for new chat messages
  useEffect(() => {
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000/events', {
      auth: { token, tenantId: 'superadmin' },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to SuperAdmin WebSocket for chats');
    });

    newSocket.on('new_chat_message', (payload) => {
      // Invalidate the query to fetch new messages
      queryClient.invalidateQueries({ queryKey: ['active-chats'] });
      // Show toast if the message is from a visitor and not the active session
      if (payload.message?.sender === 'VISITOR' && payload.sessionId !== activeSessionId) {
        toast('Nuevo mensaje en el chatbot', { icon: '💬' });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, queryClient, activeSessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, activeSessionId]);

  const replyMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      const { data } = await api.post('/support/admin-reply', { sessionId, message: content });
      return data;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['active-chats'] });
    },
    onError: () => {
      toast.error('Error al enviar el mensaje');
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeSessionId) return;
    replyMutation.mutate({ sessionId: activeSessionId, content: message });
  };

  const activeSession = sessions.find((s: any) => s.id === activeSessionId);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar - Sessions List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Chats en Vivo
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500">Cargando chats...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No hay chats activos.</div>
          ) : (
            sessions.map((session: any) => (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${
                  activeSessionId === session.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-slate-800 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {session.visitorName || 'Visitante'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">
                  {session.messages[session.messages.length - 1]?.content || 'Sin mensajes'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium">Chat con {activeSession.visitorName}</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Activo</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeSession.messages.map((msg: any) => {
                const isVisitor = msg.sender === 'VISITOR';
                const isBot = msg.sender === 'BOT';
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isVisitor ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-end gap-2 max-w-[70%]">
                      <div className={`p-3 rounded-2xl ${
                        isVisitor 
                          ? 'bg-slate-100 text-slate-800 rounded-bl-none' 
                          : isBot 
                            ? 'bg-slate-200 text-slate-700 rounded-br-none text-sm'
                            : 'bg-primary text-white rounded-br-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {isBot ? '🤖 Bot' : msg.sender} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={replyMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || replyMutation.isPending}
                  className="bg-primary text-white p-2 px-4 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
            <p>Selecciona un chat de la lista para responder</p>
          </div>
        )}
      </div>
    </div>
  );
}
