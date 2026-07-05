import { createClient } from '@supabase/supabase-js';
import { MOCK_PRODUCTS } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jadtkmohtsjsmmtwkjsz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZHRrbW9odHNqc21tdHdranN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTUyMDcsImV4cCI6MjA5ODA5MTIwN30.sTvSpHewovibPM0L62DvPMTOt90N6IZ8oIXaqJeSgvo';

const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapCreatedTimestamp = (item) => {
  if (!item) return item;
  return {
    ...item,
    created: item.created_at || item.created,
  };
};

const API_BASE = '/hcgi/api';

import { getAccessToken } from './authClient';

async function fetchFromApi(path, options = {}) {
  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || errorData.error || 'API request failed');
  }
  return res.json();
}

const dataClient = {
  authStore: {
    get isValid() {
      if (isSupabaseConfigured) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            return true;
          }
        }
      }
      return true;
    },
  },
  collection: (collectionName) => {
    const tableName = collectionName === '_integratedAiMessages' ? 'ai_messages' : collectionName;

    return {
      getFullList: async (options = {}) => {
        if (tableName === 'products' || !isSupabaseConfigured) {
          try {
            const url = tableName === 'products' ? '/products' : `/${tableName}`;
            let data = await fetchFromApi(url);

            let mappedData = (data || []).map(mapCreatedTimestamp);

            if (options.filter) {
              const filterStr = options.filter;
              const categoryMatch = filterStr.match(/category\s*=\s*"([^"]+)"/);
              if (categoryMatch) {
                mappedData = mappedData.filter((p) => p.category === categoryMatch[1]);
              }
              const idMatch = filterStr.match(/id\s*!=\s*"([^"]+)"/);
              if (idMatch) {
                mappedData = mappedData.filter((p) => p.id !== idMatch[1]);
              }
            }

            if (options.sort) {
              const isDescending = options.sort.startsWith('-');
              const field = isDescending ? options.sort.slice(1) : options.sort;
              const mappedField = field === 'created' ? 'created_at' : field;

              mappedData.sort((a, b) => {
                const valA = a[mappedField] || a[field] || '';
                const valB = b[mappedField] || b[field] || '';
                if (typeof valA === 'number' && typeof valB === 'number') {
                  return isDescending ? valB - valA : valA - valB;
                }
                return isDescending
                  ? String(valB).localeCompare(String(valA))
                  : String(valA).localeCompare(String(valB));
              });
            }

            return mappedData;
          } catch (e) {
            console.warn(`API fetch failed for ${tableName}:`, e);
            if (tableName === 'products') {
              let mappedData = [...MOCK_PRODUCTS].map(mapCreatedTimestamp);
              if (options.filter) {
                const filterStr = options.filter;
                const categoryMatch = filterStr.match(/category\s*=\s*"([^"]+)"/);
                if (categoryMatch) {
                  mappedData = mappedData.filter((p) => p.category === categoryMatch[1]);
                }
                const idMatch = filterStr.match(/id\s*!=\s*"([^"]+)"/);
                if (idMatch) {
                  mappedData = mappedData.filter((p) => p.id !== idMatch[1]);
                }
              }
              if (options.sort) {
                const isDescending = options.sort.startsWith('-');
                const field = isDescending ? options.sort.slice(1) : options.sort;
                const mappedField = field === 'created' ? 'created_at' : field;
                mappedData.sort((a, b) => {
                  const valA = a[mappedField] || a[field] || '';
                  const valB = b[mappedField] || b[field] || '';
                  if (typeof valA === 'number' && typeof valB === 'number') {
                    return isDescending ? valB - valA : valA - valB;
                  }
                  return isDescending
                    ? String(valB).localeCompare(String(valA))
                    : String(valA).localeCompare(String(valB));
                });
              }
              return mappedData;
            }
            if (!isSupabaseConfigured) return [];
          }
        }

        if (!supabase) return [];

        let query = supabase.from(tableName).select('*');

        if (options.filter) {
          const filterStr = options.filter;
          const categoryMatch = filterStr.match(/category\s*=\s*"([^"]+)"/);
          if (categoryMatch) query = query.eq('category', categoryMatch[1]);
          const idMatch = filterStr.match(/id\s*!=\s*"([^"]+)"/);
          if (idMatch) query = query.neq('id', idMatch[1]);
        }

        if (options.sort) {
          const isDescending = options.sort.startsWith('-');
          const field = isDescending ? options.sort.slice(1) : options.sort;
          const mappedField = field === 'created' ? 'created_at' : field;
          query = query.order(mappedField, { ascending: !isDescending });
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return (data || []).map(mapCreatedTimestamp);
      },

      getOne: async (id, options = {}) => {
        if (tableName === 'orders') {
          const pendingRaw = sessionStorage.getItem('nutra_blue_pending_order');
          const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
          const email = options.email || pending?.email || '';
          const query = email ? `?email=${encodeURIComponent(email)}` : '';
          const data = await fetchFromApi(`/orders/${id}${query}`);
          return mapCreatedTimestamp(data);
        }

        if (tableName === 'products' || !isSupabaseConfigured) {
          try {
            const url = tableName === 'products' ? `/products/${id}` : `/${tableName}/${id}`;
            const data = await fetchFromApi(url);
            return mapCreatedTimestamp(data);
          } catch (e) {
            console.warn(`API fetch failed for ${tableName}/${id}:`, e);
            if (tableName === 'products') {
              const product = MOCK_PRODUCTS.find((p) => p.id === id || p.name.toLowerCase() === id.toLowerCase());
              if (product) return mapCreatedTimestamp(product);
            }
            if (!isSupabaseConfigured) {
              throw new Error('No connection to database or local API.');
            }
          }
        }

        if (!supabase) throw new Error('Database client not initialized');

        const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return mapCreatedTimestamp(data);
      },
    };
  },
};

export default dataClient;
export { dataClient, isSupabaseConfigured as isSupabaseAuthAvailable };
