import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/dataClient';
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
      const localSessionRaw = localStorage.getItem('nutra_blue_customer_session');
      if (localSessionRaw) {
        try {
          const user = JSON.parse(localSessionRaw);
          setCurrentUser(user);
          setIsAuthenticated(true);
          const adminEmails = ['admin@nutrablue.cl', 'rodrigo@dentameet.net'];
          setIsAdmin(adminEmails.includes(user.email.toLowerCase()));
        } catch {
          // ignore
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
      const users = JSON.parse(localStorage.getItem('nutra_blue_mock_users') || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.password !== password) {
        throw new Error('Email o contraseña incorrectos.');
      }
      const sessionUser = { email: user.email, id: user.id, user_metadata: { full_name: user.name } };
      localStorage.setItem('nutra_blue_customer_session', JSON.stringify(sessionUser));
      setCurrentUser(sessionUser);
      setIsAuthenticated(true);
      const adminEmails = ['admin@nutrablue.cl', 'rodrigo@dentameet.net'];
      setIsAdmin(adminEmails.includes(email.toLowerCase()));
      return { user: sessionUser };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password, name) => {
    if (!supabase) {
      const users = JSON.parse(localStorage.getItem('nutra_blue_mock_users') || '[]');
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('El correo ya se encuentra registrado.');
      }
      const newUser = { id: 'mock-' + Math.random().toString(36).substr(2, 9), email, password, name };
      users.push(newUser);
      localStorage.setItem('nutra_blue_mock_users', JSON.stringify(users));
      
      const sessionUser = { email, id: newUser.id, user_metadata: { full_name: name } };
      localStorage.setItem('nutra_blue_customer_session', JSON.stringify(sessionUser));
      setCurrentUser(sessionUser);
      setIsAuthenticated(true);
      const adminEmails = ['admin@nutrablue.cl', 'rodrigo@dentameet.net'];
      setIsAdmin(adminEmails.includes(email.toLowerCase()));
      return { user: sessionUser };
    }
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
      localStorage.removeItem('nutra_blue_customer_session');
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
        authAvailable: true,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
