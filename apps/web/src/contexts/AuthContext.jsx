import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseAuthAvailable } from '@/lib/dataClient';
import { getAccessToken } from '@/lib/authClient';

export const AuthContext = createContext();

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
      await fetchAdminStatus();
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [fetchAdminStatus]);

  useEffect(() => {
    if (!supabase) {
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
    if (!supabase) throw new Error('Autenticación no disponible. Configura Supabase.');
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
        authAvailable: isSupabaseAuthAvailable(),
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
