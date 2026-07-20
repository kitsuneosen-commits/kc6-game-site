import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kc6_token');
    if (token) {
      api.getMe().then(u => setUser(u)).catch(() => localStorage.removeItem('kc6_token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (mis_id, password) => {
    const { token, user: u } = await api.login({ mis_id, password });
    localStorage.setItem('kc6_token', token);
    const full = await api.getMe();
    setUser(full);
    return full;
  };

  const register = async (mis_id, password, nickname) => {
    const { token, user: u } = await api.register({ mis_id, password, nickname });
    localStorage.setItem('kc6_token', token);
    const full = await api.getMe();
    setUser(full);
    return full;
  };

  const logout = () => {
    localStorage.removeItem('kc6_token');
    setUser(null);
  };

  const refresh = async () => {
    const u = await api.getMe();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, refreshUser: refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
