import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/dataClient';
import { getAccessToken } from '@/lib/authClient';

export const AuthContext = createContext();

const ALLOW_MOCK_AUTH = import.meta.env.VITE_ALLOW_MOCK_AUTH === 'true';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAdminStatus = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const res = await fetch('/hcgi/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.is_admin === true);
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const syncSession = useCallback(async (session) => {
    const user = session?.user ?? null;
    setCurrentUser(user);
    setIsAuthenticated(!!user);
    if (user) {
      const defaultAdmins = ['admin@nutrablue.cl', 'rodrigo@dentameet.net', 'rodrigo@dentameet.cl', 'rohidalgo@alumnos.uai.cl'];
      const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      
      const adminEmails = [...new Set([...defaultAdmins, ...envAdmins])];
      
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        setIsAdmin(true);
      } else {
        await fetchAdminStatus();
      }
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [fetchAdminStatus]);

  useEffect(() => {
    if (!supabase) {
      if (ALLOW_MOCK_AUTH) {
        const mockToken = localStorage.getItem('sb-auth-token');
        if (mockToken && mockToken.startsWith('mock-')) {
          setCurrentUser({ email: 'admin@nutrablue.cl', id: 'mock-admin-id' });
          setIsAuthenticated(true);
          setIsAdmin(true);
        }
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, [syncSession]);

  const login = async (email, password) => {
    if (!supabase) {
      if (!ALLOW_MOCK_AUTH) throw new Error('Autenticación no disponible. Configura Supabase.');
      const user = { email, id: 'mock-admin-id' };
      setCurrentUser(user);
      setIsAuthenticated(true);
      setIsAdmin(true);
      localStorage.setItem('sb-auth-token', 'mock-admin-token');
      return { user };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password, name) => {
    if (!supabase) throw new Error('Autenticación no disponible. Configura Supabase.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('sb-auth-token');
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };


  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        loading,
        authAvailable: !!supabase || ALLOW_MOCK_AUTH,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
