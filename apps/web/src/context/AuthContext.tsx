import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
interface User {
  id: string; email: string; name: string | null;
  role: 'TENANT_ADMIN' | 'CASHIER' | 'MANAGER' | 'SUPER_ADMIN';
  tenantId: string; branchId: string | null; modules?: string[];
}
interface AuthContextType {
  user: User | null; token: string | null; login: (token: string, user: User) => void;
  logout: () => void; isAuthenticated: boolean; isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'ADMIN') parsed.role = 'TENANT_ADMIN';
        if (parsed.role === 'USER') parsed.role = 'MANAGER';
        setToken(savedToken); setUser(parsed);
      } catch {
        localStorage.removeItem('token'); localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== 'visible') return;
      pending = true;
      try {
        const res = await api.get('/auth/me', { signal: controller.signal });
        if (!controller.signal.aborted && localStorage.getItem('token') === token) {
          const updated = res.data.user as User;
          setUser(prev => JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }
      } catch { /* Network failures preserve the current view; the server authorizes every operation. */ }
      finally { pending = false; }
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [token]);
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken); localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken); setUser(newUser);
  };
  const logout = () => {
    for (const key of ['token', 'user', 'impersonating', '__prev_session_token', '__prev_session_user']) localStorage.removeItem(key);
    setToken(null); setUser(null);
  };
  return <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
