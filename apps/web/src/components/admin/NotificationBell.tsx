import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../api/client';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchUnreadCount();

    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    socketRef.current = io(`${apiUrl}/events`, {
      auth: { token, tenantId: 'superadmin' }
    });

    socketRef.current.on('new_notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.success(data.title, { icon: '🔔' });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-lg transition-all duration-150"
        style={{
            color: theme === 'dark' ? 'rgba(180,195,220,0.5)' : 'rgba(75,85,99,0.7)',
            background: 'hsl(var(--background))',
            border: theme === 'dark' ? '1px solid rgba(0,153,204,0.08)' : '1px solid rgba(0,153,204,0.2)'
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#0099CC'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = theme === 'dark' ? 'rgba(180,195,220,0.5)' : 'rgba(75,85,99,0.7)'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border z-50 overflow-hidden flex flex-col"
          style={{
            background: theme === 'dark' ? 'rgba(15,23,42,0.95)' : 'white',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            maxHeight: '400px'
          }}
        >
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
              <ShieldAlert className="w-4 h-4 text-purple-500" /> Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" /> Marcar leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm opacity-50" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                No hay notificaciones
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-lg flex flex-col gap-1 transition-colors ${!n.isRead ? (theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50') : 'hover:bg-black/5'} cursor-pointer`}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold" style={{ color: theme === 'dark' ? 'white' : 'black' }}>{n.title}</span>
                    <span className="text-[10px] opacity-50" style={{ color: theme === 'dark' ? 'white' : 'black' }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
